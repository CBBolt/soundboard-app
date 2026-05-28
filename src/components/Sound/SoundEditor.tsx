import { useEffect, useState } from "react";
import { hotkeysEqual } from "../../lib/hotkey";
import SoundClipEditor from "./SoundClipEditor";

import SaveIcon from "../../icons/SaveIcon";
import HotkeyIcon from "../../icons/HotkeyIcon";
import Modal from "../Modal/Modal";
import WarningIcon from "../../icons/WarningIcon";
import HotkeyComponent from "../HotkeyComponent";
import MusicNoteIcon from "../../icons/MusicNoteIcon";
import QuestionIcon from "../../icons/QuestionIcon";
import TrashIcon from "../../icons/TrashIcon";

type Props = {
  sound: Sound;
  blob: Blob;
  allHotkeys: Hotkey[];
  playSound: (sound: Sound, options: Partial<Sound>) => void;
  stopSound: () => void;
  onSave: (data: Sound) => void;
};

export default function SoundEditor({
  sound,
  blob,
  allHotkeys,
  playSound,
  stopSound,
  onSave,
}: Props) {
  const [settings, setSettings] = useState(sound);

  const { name, hotkey, color } = settings;

  const [listeningForHotkey, setListeningForHotkey] = useState(false);
  const [curEditHotkey, setCurEditHotkey] = useState<Hotkey | null>(null);
  const [hotkeyWarning, setHotkeyWarning] = useState(false);
  const [removeHotkey, setRemoveHotkey] = useState(false);
  const [editSound, setEditSound] = useState(false);
  const [helper, setHelper] = useState(false);

  useEffect(() => {
    if (!listeningForHotkey) return;

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
  }, [listeningForHotkey, allHotkeys]);

  const handleSave = async () => {
    onSave({ ...settings });
  };

  const update =
    (key: keyof typeof settings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { type, value, checked } = e.target;

      setSettings((prev) => ({
        ...prev,
        [key]:
          type === "checkbox"
            ? checked
            : type === "number" || type === "range"
              ? Number(value)
              : value,
      }));
    };

  return (
    <>
      <div
        style={{
          display: "grid",
          gap: 10,
          marginTop: 12,
          gridTemplateColumns: "1fr 0.5fr",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        <label className="flex-gap">
          Name:
          <input type="text" value={name} onChange={update("name")} />
        </label>

        <label className="flex-gap">
          Color:
          <input
            type="color"
            value={color ?? "#FFFFFF"}
            onChange={update("color")}
            style={{ height: "100%" }}
          />
        </label>

        <div
          className="wrapper"
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {hotkey?.key ? (
            <HotkeyComponent hotkey={hotkey} />
          ) : (
            <span>No hotkey assigned</span>
          )}
          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <div
              className="icon-btn"
              onClick={() => setListeningForHotkey(true)}
            >
              <HotkeyIcon className="icon fill" />
            </div>
            {hotkey && (
              <div className="icon-btn" onClick={() => setRemoveHotkey(true)}>
                <TrashIcon className="icon stroke" />
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={helper} onClose={() => setHelper(false)}>
          <div
            className="flex-gap"
            style={{ position: "absolute", top: 20, left: 10 }}
          >
            <QuestionIcon className="icon fill" />
            <h2>Sound Editor</h2>
          </div>
          <div>
            <div className="flex-gap">
              <HotkeyIcon className="icon fill" />
              Assign Hotkeys
            </div>
            <div className="flex-gap">
              <MusicNoteIcon className="icon fill" />
              Edit Sound
            </div>
          </div>
        </Modal>

        <Modal isOpen={removeHotkey} onClose={() => setRemoveHotkey(false)}>
          <div style={{ display: "grid", justifyItems: "center" }}>
            <span>Are you sure you want to clear the hotkey?</span>
            <button
              onClick={() => {
                setSettings((p) => ({ ...p, hotkey: undefined }));
                setRemoveHotkey(false);
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
          isOpen={listeningForHotkey}
          onClose={() => {
            setListeningForHotkey(false);
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
              <div
                style={{ display: "grid", gap: 20, justifyContent: "center" }}
              >
                <HotkeyComponent hotkey={curEditHotkey} />
                <button
                  onClick={() => {
                    setSettings((p) => ({ ...p, hotkey: curEditHotkey }));
                    setListeningForHotkey(false);
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
      </div>

      <div className="seperator" />

      <SoundClipEditor
        show={editSound}
        blob={blob}
        sound={sound}
        playSound={playSound}
        stopSound={stopSound}
        onChange={(data) => setSettings((p) => ({ ...p, ...data }))}
      />

      <div
        className="flex-gap"
        style={{
          position: "absolute",
          top: 0,
          right: 50,
          justifyContent: "center",
          marginTop: "10px",
        }}
      >
        <div className="icon-btn" onClick={async () => setHelper(true)}>
          <QuestionIcon className="icon fill" />
        </div>
        <div className="icon-btn" onClick={() => setEditSound(!editSound)}>
          <MusicNoteIcon
            className="icon fill"
            style={{
              fill: editSound
                ? "oklch(from var(--base-color) calc(l * 0.5) c h)"
                : "",
            }}
          />
        </div>
        <div
          className="icon-btn"
          onClick={async () => {
            await handleSave();
            if (hotkey) window.electronAPI.registerHotkey(hotkey, sound.id);
          }}
        >
          <SaveIcon className="icon fill" />
        </div>
      </div>
    </>
  );
}
