import { useEffect, useRef, useState } from "react";
import { useEventBus } from "./contexts/GlobalEventContext";
import {
  clampVolume,
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

import RefreshIcon from "./icons/RefreshIcon";
import SpeakerIcon from "./icons/SpeakerIcon";
import TrashIcon from "./icons/TrashIcon";
import MusicNoteIcon from "./icons/MusicNoteIcon";
import CircleIcon from "./icons/CircleIcon";
import QuestionIcon from "./icons/QuestionIcon";

function App() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [editingSound, setEditingSound] = useState<Sound | null>(null);
  const [editingBlob, setEditingBlob] = useState<Blob | null>(null);
  const [deleteSound, setDeleteSound] = useState(0);
  const [recordEnabled, setRecordEnabled] = useState(false);
  const [instructionsEnabled, setInstructionsEnabled] = useState(false);
  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [VBDetected, setVBDetected] = useState({
    voicemeter: false,
    vbCable: false,
  });
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");

  const bus = useEventBus();
  const api = window.electronAPI;

  const currentOutputDeviceRef = useRef(selectedOutputDevice);
  const activePlayersRef = useRef<Set<HTMLAudioElement>>(new Set());

  // #region Loaders

  const loadOutputDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const outputs = devices.filter((d) => d.kind === "audiooutput");

      setOutputDevices(outputs);

      if (outputs.length > 0 && !selectedOutputDevice) {
        setSelectedOutputDevice(outputs[0].deviceId);
      }
    } catch (err) {
      console.error("Failed loading output devices", err);
    }
  };

  const detectVBAudio = async () => {
    const vb = await api.detectVBAudio();

    const devices = { vbCable: false, voicemeter: false };

    for (const v of vb) {
      let name = v.FriendlyName.toLowerCase();
      if (name.includes("cable")) devices.vbCable = true;
      if (name.includes("voicemeeter")) devices.voicemeter = true;
    }

    setVBDetected(devices);
  };

  // Load saved sounds
  const loadSounds = async () => {
    const savedSounds = await api.getSounds();

    setSounds(savedSounds);
  };

  const loadSettings = async () => {
    const settings = await api.readSettings();

    const color = settings.baseColor;

    const text = getContrastTextColor(color);

    document.documentElement.style.setProperty("--base-color", color);
    document.documentElement.style.setProperty("--text", text);

    setSettings(settings);
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
      gain: 1,
      fadeIn: 0,
      fadeOut: 0,
      ...sound,
      ...options,
    };

    const { startTime, endTime, gain, fadeIn, fadeOut } = playback;

    try {
      // -----------------------------------
      // Load file
      // -----------------------------------

      const filePath = await api.getSoundPath(sound.fileName);

      const buffer = await api.readSound(filePath);

      const blob = new Blob([buffer as BlobPart], {
        type: "audio/*",
      });

      const url = URL.createObjectURL(blob);

      // -----------------------------------
      // Create audio element
      // -----------------------------------

      const audio = new Audio(url);

      // -----------------------------------
      // Output device routing
      // -----------------------------------

      activePlayersRef.current.add(audio);

      // -----------------------------------
      // Metadata
      // -----------------------------------

      audio.preload = "auto";

      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();

        audio.onerror = () => reject(new Error("Failed loading audio"));
      });

      const deviceId = currentOutputDeviceRef.current;

      if (deviceId && "setSinkId" in audio) {
        try {
          await audio.setSinkId(deviceId);
        } catch (err) {
          console.warn("setSinkId failed", err);
        }
      }

      // -----------------------------------
      // Region logic
      // -----------------------------------

      const totalDuration = sound.duration ?? Number.MAX_SAFE_INTEGER;

      const safeStartTime = Math.max(0, Math.min(startTime, totalDuration));

      const safeEndTime = Math.max(
        safeStartTime,
        Math.min(endTime ?? totalDuration, totalDuration),
      );

      const duration = safeEndTime - safeStartTime;

      if (duration <= 0) {
        throw new Error("Invalid playback duration");
      }

      // -----------------------------------
      // Start position
      // -----------------------------------

      audio.currentTime = safeStartTime;

      // -----------------------------------
      // Gain
      // -----------------------------------

      audio.volume = fadeIn > 0 ? 0 : clampVolume(gain);

      // -----------------------------------
      // Play
      // -----------------------------------

      await audio.play();

      // -----------------------------------
      // Fade In
      // -----------------------------------

      if (fadeIn > 0) {
        const steps = 20;

        const startVol = 0;
        const endVol = clampVolume(gain);

        let i = 0;

        const interval = setInterval(
          () => {
            i++;

            const t = i / steps;

            audio.volume = clampVolume(startVol + (endVol - startVol) * t);

            if (i >= steps) {
              clearInterval(interval);
              audio.volume = endVol;
            }
          },
          (fadeIn * 1000) / steps,
        );
      }

      // -----------------------------------
      // Auto stop + fade out
      // -----------------------------------

      const stopAt = duration * 1000;

      const fadeOutStart = stopAt - fadeOut * 1000;

      let fadeOutInterval: number | undefined;

      if (fadeOut > 0) {
        setTimeout(() => {
          const steps = 20;

          const startVol = clampVolume(gain);

          let i = 0;

          const interval = setInterval(
            () => {
              i++;

              const t = i / steps;

              audio.volume = clampVolume(startVol * (1 - t));

              if (i >= steps) {
                clearInterval(interval);
                audio.volume = 0;
                audio.pause();
              }
            },
            (fadeOut * 1000) / steps,
          );
        }, fadeOutStart);
      }

      // -----------------------------------
      // Cleanup
      // -----------------------------------

      const cleanup = () => {
        if (fadeOutInterval) {
          clearInterval(fadeOutInterval);
        }

        audio.pause();

        activePlayersRef.current.delete(audio);

        URL.revokeObjectURL(url);
      };

      audio.onended = cleanup;

      setTimeout(cleanup, stopAt + 500);

      return audio;
    } catch (err) {
      console.error("Playback failed:", err);

      throw err;
    }
  }

  // #endregion

  const registerHotkeys = () => {
    for (const s of sounds) {
      if (s.hotkey) {
        api.registerHotkey(s.hotkey, s.id);
      }
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteSound(id);
    setDeleteSound(0);

    bus.emit("new-notification", { status: "INFO", message: "Sound Deleted!" });

    await loadSounds();
  };

  const openEditor = async (sound: Sound) => {
    const path = await api.getSoundPath(sound.fileName);

    const buffer = (await api.readSound(path)) as BlobPart;

    const blob = new Blob([buffer], {
      type: "audio/webm",
    });

    setEditingSound(sound);
    setEditingBlob(blob);
  };

  useEffect(() => {
    loadSounds();
    loadSettings();
    loadOutputDevices();
    detectVBAudio();

    bus.emit("new-notification", { status: "INFO", message: "Config Loaded!" });
  }, []);

  useEffect(() => {
    registerHotkeys();
  }, [sounds]);

  useEffect(() => {
    currentOutputDeviceRef.current = selectedOutputDevice;
  }, [selectedOutputDevice]);

  useEffect(() => {
    const unsubscribe = api.onPlaySound((soundId: string) => {
      if (soundId === "STOP_ALL") {
        stopAllSounds();
        return;
      }

      const sound = sounds.find((s) => s.id === Number(soundId));

      if (sound) {
        playSound(sound, { ...sound });
      }
    });

    return unsubscribe;
  }, [sounds, editingSound]);

  return (
    <div style={{ padding: 10 }}>
      <NotificationManager />

      <ActionsBar
        VBDetected={VBDetected}
        addSound={addSound}
        startRecord={() => setRecordEnabled(true)}
        stopAll={stopAllSounds}
        instructions={() => setInstructionsEnabled(true)}
        settings={() => setSettingsEnabled(true)}
      />

      <div className="flex-gap">
        <div className="flex-gap">
          <button onClick={loadOutputDevices}>
            <div className="flex-gap">
              <RefreshIcon className="icon stroke" />
            </div>
          </button>
          <SpeakerIcon className="icon fill" />
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <select
            value={selectedOutputDevice}
            onChange={async (e) => {
              setSelectedOutputDevice(e.target.value);
              await applyOutputDeviceToAll(e.target.value);
            }}
          >
            {outputDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Output ${d.deviceId}`}
              </option>
            ))}
          </select>
          <div className="panel">
            <strong>
              Note: If wanting to use Voicemeter with this, set Output to Cable
              Input
            </strong>
          </div>
        </div>
      </div>

      <InstructionModal
        VBDetected={VBDetected}
        show={instructionsEnabled}
        onClose={() => setInstructionsEnabled(false)}
      />

      {settings && (
        <SettingsModal
          show={settingsEnabled}
          onClose={() => setSettingsEnabled(false)}
          settings={settings}
          onSave={async (data) => {
            await api.updateSettings(data);
            setSettingsEnabled(false);

            bus.emit("new-notification", {
              status: "INFO",
              message: "Settings Updated!",
            });

            loadSettings();
          }}
        />
      )}

      <Modal isOpen={recordEnabled} onClose={() => setRecordEnabled(false)}>
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

            setRecordEnabled(false);

            bus.emit("new-notification", {
              status: "INFO",
              message: "Sound Added!",
            });

            await loadSounds();
          }}
        />
      </Modal>

      <div className="seperator" />

      <Modal isOpen={deleteSound > 0} onClose={() => setDeleteSound(0)}>
        <div style={{ display: "grid", justifyItems: "center" }}>
          <span>Are you sure you want to delete?</span>
          <button onClick={() => handleDelete(deleteSound)}>Confirm</button>
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
        isOpen={editingBlob !== null && editingSound !== null}
        onClose={() => {
          setEditingBlob(null);
          setEditingSound(null);
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
          sound={editingSound!}
          blob={editingBlob!}
          allHotkeys={
            sounds
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

            setEditingSound(null);
            setEditingBlob(null);

            loadSounds();
          }}
        />
      </Modal>

      {sounds.length === 0 && (
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
        {sounds.map((sound) => (
          <SoundTile
            key={sound.id}
            sound={sound}
            playSound={playSound}
            deleteSound={setDeleteSound}
            editSound={openEditor}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
