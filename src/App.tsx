import { useEffect, useRef, useState } from "react";
import { useEventBus } from "./contexts/GlobalEventContext";
import {
  clampVolume,
  fuzzyMatchDevices,
  getAudioDuration,
  getContrastTextColor,
} from "./lib/helpers";

import Recorder from "./components/Sound/Recorder";
import SoundEditor from "./components/Sound/SoundEditor";
import Modal from "./components/Modal/Modal";
import SoundTile from "./components/Sound/SoundTile";
import ActionsBar from "./components/ActionsBar";
import InstructionModal from "./components/Modal/InstructionModal";
import SettingsModal from "./components/Modal/SettingsModal";
import NotificationManager from "./components/Notifications/NotificationManager";

import SpeakerIcon from "./icons/SpeakerIcon";
import TrashIcon from "./icons/TrashIcon";
import MusicNoteIcon from "./icons/MusicNoteIcon";
import CircleIcon from "./icons/CircleIcon";
import QuestionIcon from "./icons/QuestionIcon";
import YoutubeLinkModal from "./components/Modal/YoutubeLinkModal";
import MicIcon from "./icons/MicIcon";
import VoiceMeeter from "./components/Modal/VoiceMeeter";
import GearIcon from "./icons/GearIcon";

/*

TODO:

 - Ability to organize sounds (labels, reorder, multiple boards?)
 - Settings (Add default devices (if available) on startup to voicemeeter)



CLEANUP:

 - Waveform ability to zoom in and out clip (time range)
 - Styles cleanup
 - Loading Spinner (Waveform & youtube upload)
 - Modal Lock style update

*/

type AppConfig = {
  sounds: Sound[];
  settings: Settings | undefined;
  editingSound: Sound | null;
  editingBlob: Blob | null;
  deleteSound: number;
  recordEnabled: boolean;
  instructionsEnabled: boolean;
  settingsEnabled: boolean;
  voicemeeterEnabled: boolean;
  youtubeEnabled: boolean;
  youtubeProgress: number;
  VBDetected: VBDetected;
  outputDevices: AudioDevice[];
  localOutputDevice: string;
  vmOutputDevice: string;
  inputDevices: AudioDevice[];
  selectedInputDevice: string;
};

function App() {
  const [config, setConfig] = useState<AppConfig>({
    sounds: [],
    settings: undefined,
    editingSound: null,
    editingBlob: null,
    deleteSound: 0,
    recordEnabled: false,
    instructionsEnabled: false,
    settingsEnabled: false,
    voicemeeterEnabled: false,
    youtubeEnabled: false,
    youtubeProgress: -1,
    VBDetected: { voicemeeter: false, vbCable: false },
    outputDevices: [],
    localOutputDevice: "",
    vmOutputDevice: "",
    inputDevices: [],
    selectedInputDevice: "",
  });

  const bus = useEventBus();
  const api = window.electronAPI;

  const currentOutputDeviceRef = useRef(config.localOutputDevice);
  const activePlayersRef = useRef<Set<HTMLAudioElement>>(new Set());

  // const audioContextRef = useRef<AudioContext>(new AudioContext());

  // function getAudioContext() {
  //   if (!audioContextRef.current) {
  //     audioContextRef.current = new AudioContext();
  //   }

  //   return audioContextRef.current;
  // }

  async function safeSetSink(audio: HTMLAudioElement, deviceId: string) {
    if (!("setSinkId" in audio)) return;

    try {
      await audio.setSinkId(deviceId);
    } catch (err) {
      console.warn("Sink failed, falling back to default output", err);
    }
  }

  // #region Loaders

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const outputs = devices.filter((d) => d.kind === "audiooutput");

      const vmOutputDevices = await api.setVMCommand({
        cmd: "output_devices",
      });

      if (!vmOutputDevices.success) {
        console.error("Failure getting VM Output Devices");
        return;
      }

      const mappedOutputs = fuzzyMatchDevices(
        vmOutputDevices.string_value!.split(", "),
        outputs,
      );

      const inputs = devices.filter((d) => d.kind === "audioinput");

      const vmInputDevices = await api.setVMCommand({
        cmd: "input_devices",
      });

      if (!vmInputDevices.success) {
        console.error("Failure getting VM Input Devices");
        return;
      }

      const mappedInputs = fuzzyMatchDevices(
        vmInputDevices.string_value!.split(", "),
        inputs,
      );

      setConfig((prev) => ({
        ...prev,
        outputDevices: mappedOutputs,
        inputDevices: mappedInputs,
      }));

      if (outputs.length > 0 && !config.localOutputDevice) {
        setConfig((prev) => ({
          ...prev,
          localOutputDevice: outputs[0].deviceId,
          vmOutputDevice: outputs[0].deviceId,
        }));
      }

      if (inputs.length > 0 && !config.selectedInputDevice) {
        setConfig((prev) => ({
          ...prev,
          selectedInputDevice: inputs[0].deviceId,
        }));
      }
    } catch (err) {
      console.error("Failed loading devices", err);
    }
  };

  const detectVBAudio = async () => {
    const vb = await api.detectVBAudio();

    const VBDetected = { vbCable: false, voicemeeter: false };

    for (const v of vb) {
      let name = v.FriendlyName.toLowerCase();
      if (name.includes("cable")) VBDetected.vbCable = true;
      if (name.includes("voicemeeter")) VBDetected.voicemeeter = true;
    }

    setConfig((prev) => ({
      ...prev,
      VBDetected,
    }));

    await api.setVMCommand({
      cmd: "set_string",
      param: "Strip[0].Device.WDM",
      string_value: "CABLE Output (VB-Audio Virtual Cable)",
    });
  };

  // Load saved sounds
  const loadSounds = async () => {
    const savedSounds = await api.getSounds();

    setConfig((prev) => ({
      ...prev,
      sounds: savedSounds,
    }));
  };

  const loadSettings = async () => {
    const settings = await api.readSettings();

    const color = settings.baseColor;

    const text = getContrastTextColor(color);

    document.documentElement.style.setProperty("--base-color", color);
    document.documentElement.style.setProperty("--text", text);

    setConfig((prev) => ({
      ...prev,
      settings,
    }));
  };

  // #endregion

  // #region Audio

  const rebindAudio = async (audio: HTMLAudioElement, deviceId: string) => {
    if (!activePlayersRef.current.has(audio)) return;

    const wasPlaying = !audio.paused;

    try {
      if (wasPlaying) audio.pause();

      await new Promise(requestAnimationFrame); // tiny stability delay

      if ("setSinkId" in audio) {
        await audio.setSinkId(deviceId);
      }

      if (wasPlaying) await audio.play();
    } catch (err) {
      console.warn("Rebind failed", err);
    }
  };

  const applyOutputDeviceToAll = async (deviceId: string) => {
    for (const audio of activePlayersRef.current) {
      await rebindAudio(audio, deviceId);
      await new Promise(requestAnimationFrame);
    }
  };

  const addSound = async () => {
    const filePath = await api.pickAudioFile();
    if (!filePath) return;

    const buffer = await api.readSound(filePath);

    const blob = new Blob([buffer as ArrayBuffer], { type: "audio/*" });

    const duration = await getAudioDuration(blob);

    api.saveSound(filePath, {
      duration,
    });

    bus.emit("new-notification", { status: "INFO", message: "Sound Added!" });

    await loadSounds();
  };

  const stopAllSounds = () => {
    for (const audio of activePlayersRef.current) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (err) {
        console.warn("Failed stopping audio", err);
      }
    }

    activePlayersRef.current.clear();
  };

  async function playSound(sound: Sound, options?: Partial<Sound>) {
    const playback = {
      startTime: 0,
      gain: 0.5,
      fadeIn: 0,
      fadeOut: 0,
      ...sound,
      ...options,
    };

    const { startTime, endTime, gain, fadeIn, fadeOut } = playback;

    let cleanupTimeout: number | undefined;

    let fadeInInterval: number | undefined;
    let fadeOutInterval: number | undefined;
    let fadeOutTimeout: number | undefined;

    const safeClear = () => {
      if (cleanupTimeout) clearTimeout(cleanupTimeout);
      if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
      if (fadeInInterval) clearInterval(fadeInInterval);
      if (fadeOutInterval) clearInterval(fadeOutInterval);
    };

    try {
      // -----------------------------------
      // Load file
      // -----------------------------------
      const filePath = await api.getSoundPath(sound.fileName);
      const buffer = await api.readSound(filePath);

      const blob = new Blob([buffer as BlobPart], { type: "audio/*" });
      const url = URL.createObjectURL(blob);

      // -----------------------------------
      // Audio element
      // -----------------------------------
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = url;

      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error("Failed loading audio"));
      });

      // -----------------------------------
      // Device routing
      // -----------------------------------
      const deviceId = currentOutputDeviceRef.current;

      if (deviceId && "setSinkId" in audio) {
        await safeSetSink(audio, deviceId);
      }

      // -----------------------------------
      // Duration safety
      // -----------------------------------
      const fileDuration = Number.isFinite(audio.duration)
        ? audio.duration
        : Number.MAX_SAFE_INTEGER;

      const safeStartTime = Math.max(0, Math.min(startTime, fileDuration));

      const safeEndTime = Math.max(
        safeStartTime,
        Math.min(endTime ?? fileDuration, fileDuration),
      );

      const playbackDuration = safeEndTime - safeStartTime;

      if (playbackDuration <= 0) throw new Error("Invalid playback duration");

      audio.currentTime = safeStartTime;

      // -----------------------------------
      // Register active player
      // -----------------------------------
      activePlayersRef.current.add(audio);

      // -----------------------------------
      // Fade-in (safer version)
      // -----------------------------------
      const targetVolume = clampVolume(gain);

      audio.volume = fadeIn > 0 ? 0 : targetVolume;

      if (fadeIn > 0) {
        const step = 50;
        const totalSteps = (fadeIn * 1000) / step;
        const increment = targetVolume / totalSteps;

        let v = 0;

        fadeInInterval = window.setInterval(() => {
          v += increment;
          audio.volume = Math.min(v, targetVolume);

          if (v >= targetVolume) {
            clearInterval(fadeInInterval);
          }
        }, step);
      }

      // -----------------------------------
      // Fade-out (simplified + safer timing)
      // -----------------------------------
      if (fadeOut > 0) {
        const step = 50;
        const durationMs = fadeOut * 1000;
        const steps = durationMs / step;
        const decrement = targetVolume / steps;

        const fadeStart = Math.max(0, (playbackDuration - fadeOut) * 1000);

        fadeOutTimeout = window.setTimeout(() => {
          let v = audio.volume;

          fadeOutInterval = window.setInterval(() => {
            v -= decrement;
            v = Math.max(0, v);

            audio.volume = v;

            if (v <= 0) {
              clearInterval(fadeOutInterval);
            }
          }, step);
        }, fadeStart);
      }

      // -----------------------------------
      // Cleanup logic (single source of truth)
      // -----------------------------------
      const cleanup = () => {
        safeClear();

        activePlayersRef.current.delete(audio);

        audio.pause();
        audio.src = "";
        audio.load();

        URL.revokeObjectURL(url);

        audio.onended = null;
        audio.onerror = null;
      };

      audio.onended = cleanup;

      // -----------------------------------
      // Play
      // -----------------------------------
      await audio.play();

      // -----------------------------------
      // Fallback stop
      // -----------------------------------
      cleanupTimeout = window.setTimeout(() => {
        cleanup();
      }, playbackDuration * 1000);

      return audio;
    } catch (err) {
      console.error("Playback failed:", err);
      throw err;
    }
  }

  // #endregion

  const registerHotkeys = () => {
    //Stop All
    if (config.settings?.stopHotkey) {
      api.registerHotkey(config.settings.stopHotkey, "STOP_ALL");
    }

    for (const s of config.sounds) {
      if (s.hotkey) {
        api.registerHotkey(s.hotkey, s.id.toString());
      }
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteSound(id);

    setConfig((prev) => ({
      ...prev,
      deleteSound: 0,
    }));

    bus.emit("new-notification", {
      status: "INFO",
      message: "Sound Deleted!",
    });

    await loadSounds();
  };

  const openEditor = async (sound: Sound) => {
    const path = await api.getSoundPath(sound.fileName);

    const buffer = (await api.readSound(path)) as BlobPart;

    const blob = new Blob([buffer], {
      type: "audio/webm",
    });

    setConfig((prev) => ({
      ...prev,
      editingBlob: blob,
      editingSound: sound,
    }));
  };

  useEffect(() => {
    loadSounds();
    loadSettings();
    loadDevices();
    detectVBAudio();

    bus.emit("new-notification", {
      status: "INFO",
      message: "Config Loaded!",
    });
  }, []);

  useEffect(() => {
    registerHotkeys();
  }, [config.sounds]);

  useEffect(() => {
    currentOutputDeviceRef.current = config.localOutputDevice;
  }, [config.localOutputDevice]);

  useEffect(() => {
    const unsubscribe = api.onPlaySound((soundId: string) => {
      if (soundId === "STOP_ALL") {
        stopAllSounds();
        bus.emit("new-notification", {
          status: "INFO",
          message: "All Sounds Stopped!",
        });
        return;
      }

      const sound = config.sounds.find((s) => s.id === Number(soundId));

      if (sound) {
        playSound(sound, { ...sound });
      }
    });

    return unsubscribe;
  }, [config.sounds, config.editingSound]);

  useEffect(() => {
    const unsubscribe = api.onYoutubeProgress((percent: number) => {
      setConfig((prev) => ({
        ...prev,
        youtubeProgress: percent,
      }));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const update = async () => {
      console.log("Device change detected → reloading audio devices");
      await loadDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", update);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", update);
    };
  }, []);

  // useEffect(() => {
  //   const ctx = getAudioContext();

  //   const recover = async () => {
  //     if (ctx.state !== "running") {
  //       try {
  //         await ctx.resume();
  //         console.log("AudioContext recovered:", ctx.state);
  //       } catch (err) {
  //         console.warn("AudioContext recovery failed", err);
  //       }
  //     }
  //   };

  //   const events = ["click", "keydown", "mousedown", "touchstart"];

  //   events.forEach((e) => window.addEventListener(e, recover));

  //   return () => {
  //     events.forEach((e) => window.removeEventListener(e, recover));
  //   };
  // }, []);

  return (
    <div style={{ padding: 10 }}>
      <NotificationManager />

      <ActionsBar
        settings={config.settings}
        VBDetected={config.VBDetected}
        addSound={addSound}
        startRecord={() =>
          setConfig((prev) => ({
            ...prev,
            recordEnabled: true,
          }))
        }
        stopAll={stopAllSounds}
        instructions={() =>
          setConfig((prev) => ({
            ...prev,
            instructionsEnabled: true,
          }))
        }
        showSettings={() =>
          setConfig((prev) => ({
            ...prev,
            settingsEnabled: true,
          }))
        }
        youtube={() =>
          setConfig((prev) => ({
            ...prev,
            youtubeEnabled: true,
          }))
        }
      />

      <div className="flex-gap">
        <div style={{ display: "grid", gap: 10 }}>
          <div className="flex-gap">
            <MicIcon className="icon fill" />
            <span>
              {
                config.inputDevices.find(
                  (d) => d.id === config.selectedInputDevice,
                )?.label
              }
            </span>
          </div>
          <div className="flex-gap">
            <SpeakerIcon className="icon fill" />
            <span>
              {
                config.outputDevices.find((d) => d.id === config.vmOutputDevice)
                  ?.label
              }
            </span>
          </div>
          <div className="flex-gap">
            <MusicNoteIcon className="icon fill" />
            <div style={{ display: "grid", gap: 10 }}>
              <select
                value={config.localOutputDevice}
                onChange={async (e) => {
                  setConfig((prev) => ({
                    ...prev,
                    localOutputDevice: e.target.value,
                  }));

                  await applyOutputDeviceToAll(e.target.value);
                }}
              >
                {config.outputDevices
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label || `Output ${d.id}`}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={() =>
            setConfig((prev) => ({ ...prev, voicemeeterEnabled: true }))
          }
        >
          <div className="flex-gap">
            <GearIcon className="icon stroke" />
          </div>
        </button>
      </div>

      <VoiceMeeter
        show={config.voicemeeterEnabled}
        outputDevices={config.outputDevices}
        selectedOutputDevice={config.vmOutputDevice}
        inputDevices={config.inputDevices}
        selectedInputDevice={config.selectedInputDevice}
        onClose={() =>
          setConfig((prev) => ({ ...prev, voicemeeterEnabled: false }))
        }
        onSave={(data) => {
          const {
            currentInputDevice: selectedInputDevice,
            currentOutputDevice: selectedOutputDevice,
          } = data;

          setConfig((prev) => ({
            ...prev,
            selectedInputDevice,
            vmOutputDevice: selectedOutputDevice,
          }));
        }}
        loadDevices={loadDevices}
      />

      <InstructionModal
        VBDetected={config.VBDetected}
        show={config.instructionsEnabled}
        onClose={() =>
          setConfig((prev) => ({
            ...prev,
            instructionsEnabled: false,
          }))
        }
      />

      <YoutubeLinkModal
        show={config.youtubeEnabled}
        onClose={() =>
          setConfig((prev) => ({
            ...prev,
            youtubeEnabled: false,
          }))
        }
        onSave={async (url) => {
          await window.electronAPI.saveYoutubeLink(url);
          setConfig((prev) => ({
            ...prev,
            youtubeProgress: -1,
            youtubeEnabled: false,
          }));
          loadSounds();
        }}
        progress={config.youtubeProgress}
      />

      {config.settings && (
        <SettingsModal
          allHotkeys={
            config.sounds
              .filter((s) => s.hotkey !== undefined)
              .map((s) => s.hotkey) as Hotkey[]
          }
          show={config.settingsEnabled}
          onClose={() =>
            setConfig((prev) => ({
              ...prev,
              settingsEnabled: false,
            }))
          }
          settings={config.settings}
          onSave={async (data) => {
            await api.updateSettings(data);
            setConfig((prev) => ({
              ...prev,
              settingsEnabled: false,
            }));

            bus.emit("new-notification", {
              status: "INFO",
              message: "Settings Updated!",
            });

            loadSettings();
          }}
        />
      )}

      <Modal
        isOpen={config.recordEnabled}
        onClose={() =>
          setConfig((prev) => ({
            ...prev,
            recordEnabled: false,
          }))
        }
      >
        <div
          className="flex-gap"
          style={{ position: "absolute", top: 15, left: 15 }}
        >
          <CircleIcon className="icon fill" />
          <h2>Record New Sound</h2>
        </div>
        <Recorder
          onSave={async (blob, duration, mimeType) => {
            const buffer = await blob.arrayBuffer();

            await api.saveRecording(buffer, {
              duration,
              mimeType,
            });

            setConfig((prev) => ({
              ...prev,
              recordEnabled: false,
            }));

            bus.emit("new-notification", {
              status: "INFO",
              message: "Sound Added!",
            });

            await loadSounds();
          }}
        />
      </Modal>

      <div className="seperator" />

      <Modal
        isOpen={config.deleteSound > 0}
        onClose={() =>
          setConfig((prev) => ({
            ...prev,
            deleteSound: 0,
          }))
        }
      >
        <div style={{ display: "grid", justifyItems: "center" }}>
          <span>Are you sure you want to delete?</span>
          <button onClick={() => handleDelete(config.deleteSound)}>
            Confirm
          </button>
        </div>
        <div
          className="flex-gap"
          style={{ position: "absolute", top: 15, left: 15 }}
        >
          <TrashIcon className="icon stroke" />
          <h2>Delete Sound</h2>
        </div>
      </Modal>

      <Modal
        isOpen={config.editingBlob !== null && config.editingSound !== null}
        onClose={() => {
          setConfig((prev) => ({
            ...prev,
            editingBlob: null,
            editingSound: null,
          }));
        }}
      >
        <div
          className="flex-gap"
          style={{ position: "absolute", top: 15, left: 15 }}
        >
          <MusicNoteIcon className="icon fill" />
          <h2>Edit Sound</h2>
        </div>
        <SoundEditor
          sound={config.editingSound!}
          blob={config.editingBlob!}
          allHotkeys={
            config.sounds
              .filter((s) => s.hotkey !== undefined)
              .map((s) => s.hotkey) as Hotkey[]
          }
          playSound={playSound}
          stopSound={stopAllSounds}
          onSave={async (data: Sound) => {
            await api.updateSound(data);

            bus.emit("new-notification", {
              status: "INFO",
              message: "Sound Updated!",
            });

            setConfig((prev) => ({
              ...prev,
              editingBlob: null,
              editingSound: null,
            }));

            loadSounds();
          }}
        />
      </Modal>

      {config.sounds.length === 0 && (
        <div>
          No sounds saved yet.
          <div>
            Not sure where to start? Click the{" "}
            <QuestionIcon className="icon sml fill" /> to get started!
          </div>
        </div>
      )}
      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
        }}
      >
        {config.sounds.map((sound) => (
          <SoundTile
            key={sound.id}
            sound={sound}
            playSound={playSound}
            deleteSound={(id) =>
              setConfig((prev) => ({ ...prev, deleteSound: id }))
            }
            editSound={openEditor}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
