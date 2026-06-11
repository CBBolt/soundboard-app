import { useEffect, useState } from "react";

import Modal from "./Modal";
import TrashIcon from "../../icons/TrashIcon";
import WarningIcon from "../../icons/WarningIcon";
import SaveIcon from "../../icons/SaveIcon";
import { hotkeysEqual } from "../../lib/hotkey";
import HotkeyComponent from "../Hotkey/HotkeyComponent";

type Props = {
  allHotkeys: Hotkey[];
  remove: boolean;
  listening: boolean;
  onSave: (hotkey: Hotkey | undefined) => void;
  onSaveClose: () => void;
  onRemove: () => void;
  onRemoveClose: () => void;
};

export default function HotkeyListenerModal({
  allHotkeys,
  listening,
  remove,
  onSave,
  onSaveClose,
  onRemove,
  onRemoveClose,
}: Props) {
  const [curEditHotkey, setCurEditHotkey] = useState<Hotkey | null>(null);
  const [hotkeyWarning, setHotkeyWarning] = useState(false);

  useEffect(() => {
    if (!listening) return;

    window.electronAPI.unregisterHotkeys();

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();

      const newHotkey: Hotkey = {
        key: e.key.toLowerCase(),
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      };

      // prevent modifier-only bindings
      if (
        newHotkey.key === "control" ||
        newHotkey.key === "shift" ||
        newHotkey.key === "alt" ||
        newHotkey.key === "meta"
      ) {
        return;
      }

      const hotkeyExists = allHotkeys.some((h) => hotkeysEqual(h, newHotkey));

      setHotkeyWarning(hotkeyExists);

      setCurEditHotkey(newHotkey);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [listening, allHotkeys]);

  return (
    <>
      <Modal isOpen={remove} onClose={onRemoveClose}>
        <div style={{ display: "grid", justifyItems: "center" }}>
          <span>Are you sure you want to clear the hotkey?</span>
          <button
            onClick={() => {
              onRemove();
              onRemoveClose();
            }}
          >
            Confirm
          </button>
        </div>
        <div
          className="flex-gap"
          style={{ position: "absolute", top: 15, left: 15 }}
        >
          <TrashIcon className="icon stroke" />
          <h2>Clear Hotkey</h2>
        </div>
      </Modal>

      <Modal
        isOpen={listening}
        onClose={() => {
          onSaveClose();
          setCurEditHotkey(null);
          setHotkeyWarning(false);
        }}
      >
        <div style={{ display: "grid", gap: 20, justifyItems: "center" }}>
          <span>Listening...</span>

          <div className="seperator" />

          <div className="panel">
            <i>
              Note: Hotkeys can cause issues if only single key. Also will
              conflict with other default hotkeys
            </i>
          </div>

          {hotkeyWarning && (
            <div className="flex-gap">
              <WarningIcon
                className="icon"
                style={{ stroke: "yellow", fill: "yellow" }}
              />
              <span style={{ color: "yellow" }}>Hotkey Already In Use</span>
            </div>
          )}

          {curEditHotkey && (
            <div style={{ display: "grid", gap: 20, justifyContent: "center" }}>
              <HotkeyComponent hotkey={curEditHotkey} />
              <button
                onClick={() => {
                  onSave(curEditHotkey);
                  onSaveClose();
                  setCurEditHotkey(null);
                  setHotkeyWarning(false);
                }}
              >
                <div className="flex-gap">
                  <SaveIcon className="icon fill" />
                  Assign Hotkey
                </div>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
