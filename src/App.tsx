import { useEffect, useState } from "react";
import { useEventBus } from "./contexts/GlobalEventContext";
import {
  getAudioDuration,
  getContrastTextColor,
  getDevices,
} from "./lib/helpers";

import { audioEngine } from "./audio/AudioEngine";

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
  loading: boolean;
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
  vmOutputDevice: VMAudioDevice;
  inputDevices: AudioDevice[];
  selectedInputDevice: VMAudioDevice;
};

function App() {
  const [config, setConfig] = useState<AppConfig>({
    loading: true,
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
    vmOutputDevice: { id: "", name: "", driver: "WDM" },
    inputDevices: [],
    selectedInputDevice: { id: "", name: "", driver: "WDM" },
  });

  const bus = useEventBus();
  const api = window.electronAPI;

  // #region Loaders

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

  const getVMConfig = async () => {
    const inputA = await api.setVMCommand({
      cmd: "get_float",
      param: "Strip[1].A1",
    });
    const inputGain = await api.setVMCommand({
      cmd: "get_float",
      param: "Strip[1].Gain",
    });
    const inputMute = await api.setVMCommand({
      cmd: "get_float",
      param: "Strip[1].Mute",
    });

    const soundboardA = await api.setVMCommand({
      cmd: "get_float",
      param: "Strip[0].A1",
    });
    const soundboardGain = await api.setVMCommand({
      cmd: "get_float",
      param: "Strip[0].Gain",
    });
    const soundboardMute = await api.setVMCommand({
      cmd: "get_float",
      param: "Strip[0].Mute",
    });

    const outputGain = await api.setVMCommand({
      cmd: "get_float",
      param: "Bus[0].Gain",
    });

    const outputMute = await api.setVMCommand({
      cmd: "get_float",
      param: "Bus[0].Mute",
    });

    return {
      input: {
        a: inputA.float_value,
        gain: inputGain.float_value,
        mute: inputMute.float_value,
      },
      soundboard: {
        a: soundboardA.float_value,
        gain: soundboardGain.float_value,
        mute: soundboardMute.float_value,
      },
      output: { gain: outputGain.float_value, mute: outputMute.float_value },
    };
  };

  // Load saved sounds
  const loadSounds = async () => {
    const savedSounds = await api.getSounds();

    setConfig((prev) => ({
      ...prev,
      sounds: savedSounds,
    }));
  };

  const loadDevices = async () => {
    const { inputs, outputs } = await getDevices();

    setConfig((prev) => ({
      ...prev,
      outputDevices: outputs,
      inputDevices: inputs,
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

  const initialize = async () => {
    const { inputs, outputs } = await getDevices();

    const settings = await api.readSettings();

    // Settings - Colors

    const color = settings.baseColor;

    const text = getContrastTextColor(color);

    document.documentElement.style.setProperty("--base-color", color);
    document.documentElement.style.setProperty("--text", text);

    if (settings.defaultInputDevice) {
      await api.setVMCommand({
        cmd: "set_string",
        param: `Strip[1].Device.${settings.defaultInputDevice.driver}`,
        string_value: settings.defaultInputDevice.name,
      });
    }

    if (settings.defaultOutputDevice) {
      await api.setVMCommand({
        cmd: "set_string",
        param: `Bus[0].Device.${settings.defaultOutputDevice.driver}`,
        string_value: settings.defaultOutputDevice.name,
      });
    }

    const localOutputDevice =
      settings.defaultLocalOutputDevice ?? outputs[0].id;

    const vmOutputDevice = settings.defaultOutputDevice ?? {
      name: outputs[0].label,
      id: outputs[0].id,
      driver: "WDM",
    };

    const selectedInputDevice = settings.defaultInputDevice ?? {
      name: inputs[0].label,
      id: inputs[0].id,
      driver: "WDM",
    };

    setConfig((prev) => ({
      ...prev,
      settings,
      outputDevices: outputs,
      inputDevices: inputs,
      localOutputDevice,
      vmOutputDevice,
      selectedInputDevice,
    }));
  };

  // #endregion

  // #region Audio

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
    const load = async () => {
      try {
        await Promise.all([initialize(), loadSounds(), detectVBAudio()]);

        bus.emit("new-notification", {
          status: "INFO",
          message: "Config Loaded!",
        });
      } catch (err) {
        console.error("Initialization failed", err);

        bus.emit("new-notification", {
          status: "ERROR",
          message: "Failed to load config",
        });
      } finally {
        setConfig((prev) => ({ ...prev, loading: false }));
      }
    };

    load();
  }, []);

  useEffect(() => {
    registerHotkeys();
  }, [config.sounds, config.settings]);

  useEffect(() => {
    const unsubscribe = api.onPlaySound(async (soundId: string) => {
      if (soundId === "STOP_ALL") {
        audioEngine.stopAll();
        bus.emit("new-notification", {
          status: "INFO",
          message: "All Sounds Stopped!",
        });
        return;
      }

      const sound = config.sounds.find((s) => s.id === Number(soundId));

      if (sound) {
        audioEngine.play(sound);
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

  if (config.loading) return <span>Loading...</span>;

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
        stopAll={audioEngine.stopAll}
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
                  (d) => d.id === config.selectedInputDevice.id,
                )?.label
              }
            </span>
          </div>
          <div className="flex-gap">
            <SpeakerIcon className="icon fill" />
            <span>
              {
                config.outputDevices.find(
                  (d) => d.id === config.vmOutputDevice.id,
                )?.label
              }
            </span>
          </div>
          <div className="flex-gap">
            <MusicNoteIcon className="icon fill" />
            <div style={{ display: "flex", gap: 10 }}>
              <select
                value={config.localOutputDevice}
                onChange={async (e) => {
                  audioEngine.setDevice(e.target.value);

                  setConfig((prev) => ({
                    ...prev,
                    localOutputDevice: e.target.value,
                  }));
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
              <button
                onClick={() => {
                  const vbCableInput = config.outputDevices.find((d) =>
                    d.label.toLowerCase().includes("cable input"),
                  );

                  if (!vbCableInput) {
                    console.error("VB Cable Input not found");
                    return;
                  }

                  audioEngine.setDevice(vbCableInput.id);

                  setConfig((prev) => ({
                    ...prev,
                    localOutputDevice: vbCableInput?.id,
                  }));
                }}
              >
                Send to VoiceMeeter
              </button>
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
        loadVMConfig={getVMConfig}
        onClose={() =>
          setConfig((prev) => ({ ...prev, voicemeeterEnabled: false }))
        }
        onSave={(data) => {
          const { currentInputDevice, currentOutputDevice } = data;

          setConfig((prev) => ({
            ...prev,
            selectedInputDevice: currentInputDevice,
            vmOutputDevice: currentOutputDevice,
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
          inputDevices={config.inputDevices}
          outputDevices={config.outputDevices}
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
          loadSettings={api.readSettings}
          onSave={async (data) => {
            await api.updateSettings(data);
            setConfig((prev) => ({
              ...prev,
              settingsEnabled: false,
            }));

            loadSettings();

            bus.emit("new-notification", {
              status: "INFO",
              message: "Settings Updated!",
            });
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
        header={
          <>
            <CircleIcon className="icon fill" />
            <h2>Record New Sound</h2>
          </>
        }
      >
        <Recorder
          defaultInputDevice={config.selectedInputDevice.id}
          devices={config.inputDevices}
          loadDevices={loadDevices}
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
        header={
          <>
            <TrashIcon className="icon stroke" />
            <h2>Delete Sound</h2>
          </>
        }
      >
        <div style={{ display: "grid", justifyItems: "center" }}>
          <span>Are you sure you want to delete?</span>
          <button onClick={() => handleDelete(config.deleteSound)}>
            Confirm
          </button>
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
        header={
          <>
            <MusicNoteIcon className="icon fill" />
            <h2>Edit Sound</h2>
          </>
        }
      >
        <SoundEditor
          sound={config.editingSound!}
          blob={config.editingBlob!}
          allHotkeys={
            config.sounds
              .filter((s) => s.hotkey !== undefined)
              .map((s) => s.hotkey) as Hotkey[]
          }
          playSound={audioEngine.play}
          stopSound={audioEngine.stopAll}
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
            playSound={audioEngine.play}
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
