import { useEffect, useState } from "react";
import { useEventBus } from "./contexts/GlobalEventContext";
import {
  checkVM,
  getAudioDuration,
  getContrastTextColor,
  getDevices,
  getVMConfig,
} from "./lib/helpers";

import { audioEngine } from "./audio/AudioEngine";

import Recorder from "./components/Sound/Recorder";
import SoundEditor from "./components/Sound/SoundEditor";
import Modal from "./components/Modal/Modal";
import ActionsBar from "./components/ActionsBar";
import InstructionModal from "./components/Modal/InstructionModal";
import SettingsModal from "./components/Modal/SettingsModal";
import NotificationManager from "./components/Notifications/NotificationManager";

import TrashIcon from "./icons/TrashIcon";
import MusicNoteIcon from "./icons/MusicNoteIcon";
import CircleIcon from "./icons/CircleIcon";
import YoutubeLinkModal from "./components/Modal/YoutubeLinkModal";
import Splashscreen from "./components/SplashScreen";
import SoundLibrary from "./components/Library/SoundLibrary";
import BoardManager from "./components/Board/BoardManager";
import TagManager from "./components/Tag/TagManager";
import SideBar from "./components/SideBar";
import SoundboardIcon from "./icons/SoundboardIcon";
import TagIcon from "./icons/TagIcon";
import GlobalTooltip from "./components/Tooltip/GlobalTooltip";
import { useTutorial } from "./tutorial/TutorialContext";
import {
  baseTutorial,
  vmReminder,
  vmTutorial,
} from "./tutorial/tutorials/tutorialSteps";

/*

CLEANUP:
 - Component Cleanup
 - Notifications anywhere console.log / error / warn

*/

// #region Types

type AppData = {
  sounds: Sound[];
  boards: Board[];
  tags: Tag[];
  settings?: Settings;
};

type EditingState = {
  editingSound: Sound | null;
  editingBlob: Blob | null;
  deleteSound: number;
};

type ModalState = {
  instructionsEnabled: boolean;
  settingsEnabled: boolean;
  recordEnabled: boolean;
  youtubeEnabled: boolean;
};

type UIState = {
  loading: boolean;
  controllerOverlay: boolean;
  loadedBoard: number;
  youtubeProgress: number;
  VBDetected: VBDetected;
  toVoiceMeeter: boolean;
  tab: "SOUND" | "BOARD" | "TAG";
};

type AudioState = {
  outputDevices: AudioDevice[];
  localOutputDevice: string;

  inputDevices: AudioDevice[];
  selectedInputDevice: VMAudioDevice;

  vmOutputDevice: VMAudioDevice;
};

// #endregion

type AppConfig = {
  data: AppData;
  modal: ModalState;
  editing: EditingState;
  ui: UIState;
  audio: AudioState;
};

function App() {
  const [config, setConfig] = useState<AppConfig>({
    data: {
      sounds: [],
      boards: [],
      tags: [],
      settings: undefined,
    },
    modal: {
      recordEnabled: false,
      instructionsEnabled: false,
      settingsEnabled: false,
      youtubeEnabled: false,
    },
    editing: {
      editingSound: null,
      editingBlob: null,
      deleteSound: 0,
    },
    ui: {
      loading: true,
      controllerOverlay: false,
      loadedBoard: -1,
      youtubeProgress: -1,
      VBDetected: { voicemeeter: false, vbCable: false },
      toVoiceMeeter: false,
      tab: "SOUND",
    },
    audio: {
      outputDevices: [],
      localOutputDevice: "",
      vmOutputDevice: { id: "", name: "", driver: "WDM" },
      inputDevices: [],
      selectedInputDevice: { id: "", name: "", driver: "WDM" },
    },
  });

  const { startFlow } = useTutorial();
  const bus = useEventBus();
  const api = window.electronAPI;

  // #region Loaders

  const detectVBAudio = async () => {
    const vb = await checkVM();

    setConfig((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        vb,
      },
    }));

    if (vb.voicemeeter) {
      await api.setVMCommand({
        cmd: "set_string",
        param: "Strip[0].Device.WDM",
        string_value: "CABLE Output (VB-Audio Virtual Cable)",
      });
    }
  };

  // Load saved sounds
  const loadBoards = async () => {
    const savedBoards = await api.getBoards();

    setConfig((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        boards: savedBoards,
      },
    }));
  };

  // Load saved sounds
  const loadTags = async () => {
    const savedTags = await api.getTags();

    setConfig((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        tags: savedTags,
      },
    }));
  };

  // Load saved sounds
  const loadSounds = async () => {
    const savedSounds = await api.getSounds();

    setConfig((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        sounds: savedSounds,
      },
    }));
  };

  const loadDevices = async () => {
    const { inputs, outputs } = await getDevices();

    setConfig((prev) => ({
      ...prev,
      audio: {
        ...prev.audio,
        outputDevices: outputs.filter((d) => {
          const label = d.label.toLowerCase();

          return !["cable", "voicemeeter"].some((blocked) =>
            label.includes(blocked),
          );
        }),
        inputDevices: inputs,
      },
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
      data: {
        ...prev.data,
        settings,
      },
    }));
  };

  const initialize = async () => {
    const { inputs, outputs } = await getDevices();
    const settings = await api.readSettings();
    const vb = await checkVM();

    // Colors
    const color = settings.baseColor;
    const text = getContrastTextColor(color);

    document.documentElement.style.setProperty("--base-color", color);
    document.documentElement.style.setProperty("--text", text);

    //Tutorials
    if (!settings.baseTutorial) {
      startFlow(baseTutorial, "baseTutorial");
      await api.updateSettings({ baseTutorial: true });
    } else if (settings.baseTutorial && !vb.voicemeeter) {
      startFlow(vmReminder, "vmReminder");
    } else if (
      settings.baseTutorial &&
      !settings.vmTutorial &&
      vb.voicemeeter
    ) {
      startFlow(vmTutorial, "vmTutorial");
      await api.updateSettings({ vmTutorial: true });
    }

    // Resolve input device
    const selectedInputDevice: VMAudioDevice =
      settings.defaultInputDevice &&
      inputs.some((d) => d.id === settings.defaultInputDevice?.id)
        ? settings.defaultInputDevice
        : {
            name: inputs[0].label,
            id: inputs[0].id,
            driver: "WDM",
          };

    // Resolve VM output device
    const vmOutputDevice: VMAudioDevice =
      settings.defaultOutputDevice &&
      outputs.some((d) => d.id === settings.defaultOutputDevice?.id)
        ? settings.defaultOutputDevice
        : {
            name: outputs[0].label,
            id: outputs[0].id,
            driver: "WDM",
          };

    // Resolve local output device
    const localOutputDevice =
      settings.defaultLocalOutputDevice &&
      outputs.some((d) => d.id === settings.defaultLocalOutputDevice)
        ? settings.defaultLocalOutputDevice
        : outputs[0].id;

    audioEngine.setDevice(localOutputDevice);

    if (vb.voicemeeter) {
      // Apply to VoiceMeeter
      await api.setVMCommand({
        cmd: "set_string",
        param: `Strip[1].Device.${selectedInputDevice.driver}`,
        string_value: selectedInputDevice.name,
      });

      await api.setVMCommand({
        cmd: "set_string",
        param: `Bus[0].Device.${vmOutputDevice.driver}`,
        string_value: vmOutputDevice.name,
      });
    }

    setConfig((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        settings,
      },
      audio: {
        ...prev.audio,
        outputDevices: outputs.filter((d) => {
          const label = d.label.toLowerCase();

          return !["cable", "voicemeeter"].some((blocked) =>
            label.includes(blocked),
          );
        }),
        inputDevices: inputs,
        localOutputDevice,
        vmOutputDevice,
        selectedInputDevice,
      },
    }));
  };

  // #endregion

  // #region Helpers

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

  const registerHotkeys = () => {
    //Stop All
    if (config.data.settings?.controllerToggleHotkey) {
      api.registerHotkey(config.data.settings.controllerToggleHotkey, {
        type: "controller",
      });
    }

    if (config.data.settings?.stopHotkey) {
      api.registerHotkey(config.data.settings.stopHotkey, {
        type: "sound",
        soundId: "STOP_ALL",
      });
    }

    for (const s of config.data.sounds) {
      if (s.hotkey) {
        api.registerHotkey(s.hotkey, {
          type: "sound",
          soundId: s.id.toString(),
        });
      }
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteSound(id);

    setConfig((prev) => ({
      ...prev,
      editing: {
        ...prev.editing,
        deleteSound: 0,
      },
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
      editing: {
        ...prev.editing,
        editingBlob: blob,
        editingSound: sound,
      },
    }));
  };

  // #endregion

  // #region Use Effect

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          initialize(),
          loadSounds(),
          loadBoards(),
          loadTags(),
          detectVBAudio(),
        ]);

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
        setConfig((prev) => ({
          ...prev,
          ui: { ...prev.ui, loading: false },
        }));
      }
    };

    load();
  }, []);

  useEffect(() => {
    registerHotkeys();
  }, [config.data.sounds, config.data.settings]);

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

      const sound = config.data.sounds.find((s) => s.id === Number(soundId));

      if (sound) {
        audioEngine.play(sound);
      }
    });

    return unsubscribe;
  }, [config.data.sounds, config.editing.editingSound]);

  useEffect(() => {
    const unsubscribe = api.onToggleController((data: boolean) => {
      setConfig((prev) => ({
        ...prev,
        ui: {
          ...prev.ui,
          controllerOverlay: data,
        },
      }));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = api.onYoutubeProgress((percent: number) => {
      setConfig((prev) => ({
        ...prev,
        ui: {
          ...prev.ui,
          youtubeProgress: percent,
        },
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

  // #endregion

  if (config.ui.loading) return <Splashscreen />;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
      }}
    >
      <NotificationManager />
      <GlobalTooltip />

      <ActionsBar
        VBDetected={config.ui.VBDetected}
        overlay={config.ui.controllerOverlay}
        toggleOverlay={() => {
          setConfig((prev) => ({
            ...prev,
            ui: { ...prev.ui, controllerOverlay: !prev.ui.controllerOverlay },
          }));

          if (config.ui.controllerOverlay) {
            api.hideController();
          } else {
            api.showController();
          }
        }}
        instructions={() =>
          setConfig((prev) => ({
            ...prev,
            modal: {
              ...prev.modal,
              instructionsEnabled: true,
            },
          }))
        }
        showSettings={() =>
          setConfig((prev) => ({
            ...prev,
            modal: {
              ...prev.modal,
              settingsEnabled: true,
            },
          }))
        }
        settings={config.data.settings}
        stopAll={audioEngine.stopAll}
      />

      <div
        className="flex-gap"
        style={{ alignItems: "start", overflowY: "auto", height: "100%" }}
      >
        <SideBar
          voiceMeeter={{
            currentInput: config.audio.selectedInputDevice,
            currentOuput: config.audio.vmOutputDevice,
            currentLocalOutput: config.audio.localOutputDevice,
            inputDevices: config.audio.inputDevices,
            outputDevices: config.audio.outputDevices,
            toVoiceMeeter: config.ui.toVoiceMeeter,
            loadDevices: loadDevices,
            getVMConfig: getVMConfig,
            onToggle: async () => {
              if (!config.ui.toVoiceMeeter) {
                const { outputs } = await getDevices();

                const vbCableInput = outputs.find((d) =>
                  d.label.toLowerCase().includes("cable input"),
                );

                if (!vbCableInput) {
                  console.warn("VB Cable Input not found");
                  bus.emit("new-notification", {
                    status: "WARNING",
                    message: "Voice Meeter Not Installed!",
                  });
                  return;
                }

                audioEngine.setDevice(vbCableInput.id);
              } else {
                audioEngine.setDevice(config.audio.localOutputDevice);
              }

              setConfig((prev) => ({
                ...prev,
                ui: {
                  ...prev.ui,
                  toVoiceMeeter: !prev.ui.toVoiceMeeter,
                },
              }));
            },
            onVoiceMeeterChange: (data) => {
              const { currentInputDevice, currentOutputDevice } = data;

              setConfig((prev) => ({
                ...prev,
                audio: {
                  ...prev.audio,
                  selectedInputDevice: currentInputDevice,
                  vmOutputDevice: currentOutputDevice,
                },
              }));
            },
            onLocalChange: (value) => {
              audioEngine.setDevice(value);

              setConfig((prev) => ({
                ...prev,
                audio: {
                  ...prev.audio,
                  localOutputDevice: value,
                },
              }));
            },
          }}
          loadedBoard={config.data.boards.find(
            (b) => b.id === config.ui.loadedBoard,
          )}
          curItem={config.ui.tab}
          items={[
            {
              id: "SOUND",
              label: "Sound Library",
              icon: <MusicNoteIcon className="icon fill sml" />,
              onClick: () =>
                setConfig((prev) => ({
                  ...prev,
                  ui: { ...prev.ui, tab: "SOUND" },
                })),
            },
            {
              id: "BOARD",
              label: "Board Library",
              icon: <SoundboardIcon className="icon stroke sml" />,
              onClick: () =>
                setConfig((prev) => ({
                  ...prev,
                  ui: { ...prev.ui, tab: "BOARD" },
                })),
            },
            {
              id: "TAG",
              label: "Tag Library",
              icon: <TagIcon className="icon stroke sml" />,
              onClick: () =>
                setConfig((prev) => ({
                  ...prev,
                  ui: { ...prev.ui, tab: "TAG" },
                })),
            },
          ]}
        />

        {/* ================= MODALS ================= */}

        <InstructionModal
          VBDetected={config.ui.VBDetected}
          show={config.modal.instructionsEnabled}
          onClose={() =>
            setConfig((prev) => ({
              ...prev,
              modal: {
                ...prev.modal,
                instructionsEnabled: false,
              },
            }))
          }
        />

        <YoutubeLinkModal
          show={config.modal.youtubeEnabled}
          onClose={() =>
            setConfig((prev) => ({
              ...prev,
              modal: {
                ...prev.modal,
                youtubeEnabled: false,
              },
            }))
          }
          onSave={async (url) => {
            try {
              await window.electronAPI.saveYoutubeLink(url);
              setConfig((prev) => ({
                ...prev,
                modal: {
                  ...prev.modal,
                  youtubeEnabled: false,
                },
              }));
            } catch (err) {
              console.error(err);
              bus.emit("new-notification", {
                status: "ERROR",
                message: "Error adding sound from link",
              });
            } finally {
              setConfig((prev) => ({
                ...prev,
                ui: {
                  ...prev.ui,
                  youtubeProgress: -1,
                },
              }));

              loadSounds();
            }
          }}
          progress={config.ui.youtubeProgress}
        />

        {config.data.settings && (
          <SettingsModal
            inputDevices={config.audio.inputDevices}
            outputDevices={config.audio.outputDevices}
            allHotkeys={
              config.data.sounds
                .filter((s) => s.hotkey !== undefined)
                .map((s) => s.hotkey) as Hotkey[]
            }
            show={config.modal.settingsEnabled}
            onClose={() =>
              setConfig((prev) => ({
                ...prev,
                modal: {
                  ...prev.modal,
                  settingsEnabled: false,
                },
              }))
            }
            loadSettings={api.readSettings}
            onSave={async (data) => {
              await api.updateSettings(data);
              setConfig((prev) => ({
                ...prev,
                modal: {
                  ...prev.modal,
                },
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
          isOpen={config.modal.recordEnabled}
          onClose={() =>
            setConfig((prev) => ({
              ...prev,
              modal: {
                ...prev.modal,
                recordEnabled: false,
              },
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
            defaultInputDevice={config.audio.selectedInputDevice.id}
            devices={config.audio.inputDevices}
            loadDevices={loadDevices}
            onSave={async (blob, duration, mimeType) => {
              const buffer = await blob.arrayBuffer();

              await api.saveRecording(buffer, {
                duration,
                mimeType,
              });

              setConfig((prev) => ({
                ...prev,
                modal: {
                  ...prev.modal,
                  recordEnabled: false,
                },
              }));

              bus.emit("new-notification", {
                status: "INFO",
                message: "Sound Added!",
              });

              await loadSounds();
            }}
          />
        </Modal>

        <Modal
          isOpen={config.editing.deleteSound > 0}
          onClose={() =>
            setConfig((prev) => ({
              ...prev,
              editing: {
                ...prev.editing,
                deleteSound: 0,
              },
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
            <button onClick={() => handleDelete(config.editing.deleteSound)}>
              Confirm
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={
            config.editing.editingBlob !== null &&
            config.editing.editingSound !== null
          }
          onClose={() => {
            setConfig((prev) => ({
              ...prev,
              editing: {
                ...prev.editing,
                editingBlob: null,
                editingSound: null,
              },
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
            sound={config.editing.editingSound!}
            allTags={config.data.tags}
            blob={config.editing.editingBlob!}
            allHotkeys={
              config.data.sounds
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
                editing: {
                  ...prev.editing,
                  editingBlob: null,
                  editingSound: null,
                },
              }));

              loadSounds();
            }}
          />
        </Modal>

        {/* ================================== */}

        <div
          className="flex-gap"
          style={{
            flex: 1,
            flexDirection: "column",
            alignItems: "start",
            height: "calc(100% - 10px)",
          }}
        >
          <div
            className="flex-gap"
            style={{
              flexDirection: "column",
              height: "100%",
              width: "calc(100% - 10px)",
              alignItems: "start",
              background: "rgba(0, 0, 0, 0.2)",
              padding: 5,
              borderRadius: 5,
            }}
          >
            {config.ui.tab === "SOUND" ? (
              <SoundLibrary
                sounds={config.data.sounds}
                allTags={config.data.tags}
                playSound={(sound) => audioEngine.play(sound)}
                onDelete={(id) =>
                  setConfig((prev) => ({
                    ...prev,
                    editing: { ...prev.editing, deleteSound: id },
                  }))
                }
                onEdit={openEditor}
                addSound={addSound}
                startRecord={() =>
                  setConfig((prev) => ({
                    ...prev,
                    modal: { ...prev.modal, recordEnabled: true },
                  }))
                }
                addYoutube={() =>
                  setConfig((prev) => ({
                    ...prev,
                    modal: { ...prev.modal, youtubeEnabled: true },
                  }))
                }
              />
            ) : config.ui.tab === "BOARD" ? (
              <BoardManager
                allTags={config.data.tags}
                boards={config.data.boards}
                sounds={config.data.sounds}
                playSound={(sound) => audioEngine.play(sound)}
                loadBoards={loadBoards}
                loadedBoard={config.data.boards.find(
                  (b) => b.id === config.ui.loadedBoard,
                )}
                onSetLoadedBoard={(id) =>
                  setConfig((prev) => ({
                    ...prev,
                    ui: { ...prev.ui, loadedBoard: id },
                  }))
                }
              />
            ) : (
              <TagManager tags={config.data.tags} loadTags={loadTags} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
