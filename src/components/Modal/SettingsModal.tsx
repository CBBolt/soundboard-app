import { useState } from "react";

import GearIcon from "../../icons/GearIcon";
import Modal from "./Modal";
import SaveIcon from "../../icons/SaveIcon";

type Props = {
  show: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (data: Partial<Settings>) => void;
};

export default function SettingsModal({
  settings,
  show,
  onClose,
  onSave,
}: Props) {
  const [localSettings, setLocalSettings] = useState(settings);

  const update =
    (key: keyof typeof settings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;

      setLocalSettings((prev) => ({
        ...prev,
        [key]: value,
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
          onClick={() => onSave(localSettings)}
        >
          <SaveIcon className="icon fill" />
        </div>

        <div className="flex-gap">
          <span>Base Color:</span>
          <input
            type="color"
            value={localSettings.baseColor}
            onChange={update("baseColor")}
            style={{ height: 50 }}
          />
        </div>
      </>
    </Modal>
  );
}
