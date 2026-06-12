import { useEffect, useState } from "react";

import GearIcon from "../../icons/GearIcon";
import Modal from "./Modal";
import SaveIcon from "../../icons/SaveIcon";
import HotkeyWrapper from "../Hotkey/HotkeyWrapper";
import HotkeyListenerModal from "./HotkeyListenerModal";
import MicIcon from "../../icons/MicIcon";
import VMDeviceDriverSelector from "../VoiceMeeter/VMDeviceDriverSelector";
import SpeakerIcon from "../../icons/SpeakerIcon";
import VMDeviceSelector from "../VoiceMeeter/VMDeviceSelector";

type Props = {
  allHotkeys: Hotkey[];
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  show: boolean;
  onClose: () => void;
  onSave: (data: Partial<Settings>) => void;
  loadSettings: () => Settings;
};

type SettingsType = {
  settings: Settings | null;
  listeningForHotkey: boolean;
  removeHotkey: boolean;
};

export default function SettingsModal({
  allHotkeys,
  inputDevices,
  outputDevices,
  show,
  loadSettings,
  onClose,
  onSave,
}: Props) {
  const [config, setConfig] = useState<SettingsType>({
    settings: null,
    listeningForHotkey: false,
    removeHotkey: false,
  });

  useEffect(() => {
    const getSettings = async () => {
      const settings = await loadSettings();
      setConfig((prev) => ({ ...prev, settings }));
    };

    getSettings();
  }, [show]);

  const update =
    (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!config.settings) return;

      const { value } = e.target;

      setConfig((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [key]: value,
        } as Settings,
      }));
    };

  if (!config.settings) return;

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      header={
        <>
          <GearIcon className="icon stroke" />
          <h2>Settings</h2>
        </>
      }
    >
      <>
        <div
          className="icon-btn"
          style={{ position: "absolute", top: 10, right: 50 }}
          onClick={() => onSave(config.settings!)}
        >
          <SaveIcon className="icon fill" />
        </div>

        <div className="flex-gap">
          <span>Base Color:</span>
          <input
            type="color"
            value={config.settings.baseColor}
            onChange={update("baseColor")}
            style={{ height: 50 }}
          />
        </div>
        <div className="flex-gap">
          <span>Stop All Hotkey:</span>
          <HotkeyWrapper
            hotkey={config.settings.stopHotkey}
            onListen={() =>
              setConfig((prev) => ({
                ...prev,
                listeningForHotkey: true,
              }))
            }
            onRemove={() =>
              setConfig((prev) => ({
                ...prev,
                removeHotkey: true,
              }))
            }
          />
        </div>
        <div className="flex-gap">
          <span>Default Mic:</span>
          <div className="flex-gap">
            <MicIcon className="icon fill" />
            <VMDeviceDriverSelector
              currentDevice={config.settings.defaultInputDevice}
              devices={inputDevices}
              onChange={(device) => {
                setConfig((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultInputDevice: device,
                  } as Settings,
                }));
              }}
            />
          </div>
        </div>

        <div className="flex-gap">
          <span>Default Output:</span>
          <div className="flex-gap">
            <SpeakerIcon className="icon fill" />
            <VMDeviceDriverSelector
              currentDevice={config.settings.defaultOutputDevice}
              devices={outputDevices}
              onChange={(device) => {
                setConfig((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultOutputDevice: device,
                  } as Settings,
                }));
              }}
            />
          </div>
        </div>

        <div className="flex-gap">
          <span>Default Local Output:</span>
          <div className="flex-gap">
            <SpeakerIcon className="icon fill" />
            <VMDeviceSelector
              currentDevice={config.settings.defaultLocalOutputDevice}
              devices={outputDevices}
              onChange={(value: string) => {
                setConfig((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    defaultLocalOutputDevice:
                      value ?? config.settings?.defaultLocalOutputDevice,
                  } as Settings,
                }));
              }}
            />
          </div>
        </div>

        <HotkeyListenerModal
          allHotkeys={allHotkeys}
          remove={config.removeHotkey}
          listening={config.listeningForHotkey}
          onSave={(hotkey) =>
            setConfig((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                stopHotkey: hotkey as Hotkey,
              } as Settings,
            }))
          }
          onSaveClose={() =>
            setConfig((prev) => ({ ...prev, listeningForHotkey: false }))
          }
          onRemove={() =>
            setConfig((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                stopHotkey: { key: "esc", shift: true } as Hotkey,
              } as Settings,
            }))
          }
          onRemoveClose={() =>
            setConfig((prev) => ({ ...prev, removeHotkey: false }))
          }
        />
      </>
    </Modal>
  );
}
