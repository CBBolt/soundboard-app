import { useState } from "react";

import GearIcon from "../../icons/GearIcon";
import Modal from "./Modal";
import SaveIcon from "../../icons/SaveIcon";
import HotkeyWrapper from "../Hotkey/HotkeyWrapper";
import HotkeyListenerModal from "./HotkeyListenerModal";

type Props = {
  allHotkeys: Hotkey[];
  show: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (data: Partial<Settings>) => void;
};

type SettingsType = {
  settings: Settings;
  listeningForHotkey: boolean;
  removeHotkey: boolean;
};

export default function SettingsModal({
  allHotkeys,
  settings,
  show,
  onClose,
  onSave,
}: Props) {
  const [config, setConfig] = useState<SettingsType>({
    settings,
    listeningForHotkey: false,
    removeHotkey: false,
  });

  const update =
    (key: keyof typeof settings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;

      setConfig((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [key]: value,
        },
      }));
    };

  return (
    <Modal isOpen={show} onClose={onClose}>
      <>
        <div
          className="flex-gap"
          style={{ position: "absolute", top: 10, left: 10 }}
        >
          <GearIcon className="icon stroke" />
          <h2>Settings</h2>
        </div>

        <div
          className="icon-btn"
          style={{ position: "absolute", top: 10, right: 50 }}
          onClick={() => onSave(config.settings)}
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
        <HotkeyListenerModal
          allHotkeys={allHotkeys}
          remove={config.removeHotkey}
          listening={config.listeningForHotkey}
          onSave={(hotkey) =>
            setConfig((prev) => ({
              ...prev,
              settings: { ...prev.settings, stopHotkey: hotkey as Hotkey },
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
              },
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
