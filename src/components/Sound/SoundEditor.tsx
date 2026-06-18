import { useState } from "react";

import SoundClipEditor from "./SoundClipEditor";

import SaveIcon from "../../icons/SaveIcon";
import HotkeyIcon from "../../icons/HotkeyIcon";
import Modal from "../Modal/Modal";
import MusicNoteIcon from "../../icons/MusicNoteIcon";
import QuestionIcon from "../../icons/QuestionIcon";
import HotkeyListenerModal from "../Modal/HotkeyListenerModal";
import HotkeyWrapper from "../Hotkey/HotkeyWrapper";
import PencilIcon from "../../icons/PencilIcon";
import ArrowIcon from "../../icons/ArrowIcon";

type Props = {
  sound: Sound;
  allTags: Tag[];
  blob: Blob;
  allHotkeys: Hotkey[];
  playSound: (sound: Sound) => void;
  stopSound: () => void;
  onSave: (data: Sound) => void;
};

type SoundSettings = {
  settings: Sound;
  listeningForHotkey: boolean;
  removeHotkey: boolean;
  editSound: boolean;
  editIcon: boolean;
  editTags: boolean;
  helper: boolean;
};

export default function SoundEditor({
  sound,
  allTags,
  blob,
  allHotkeys,
  playSound,
  stopSound,
  onSave,
}: Props) {
  const [config, setConfig] = useState<SoundSettings>({
    settings: { ...sound, tags: sound.tags ?? [] },
    listeningForHotkey: false,
    removeHotkey: false,
    editSound: false,
    editIcon: false,
    helper: false,
    editTags: false,
  });

  const { name, hotkey, color } = config.settings;

  const handleSave = async () => {
    onSave({ ...config.settings });
  };

  const update =
    (key: keyof typeof config.settings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { type, value, checked } = e.target;

      setConfig((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [key]:
            type === "checkbox"
              ? checked
              : type === "number" || type === "range"
                ? Number(value)
                : value,
        },
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
        {/* <label className="flex-gap">
          Icon:{" "}
          {config.settings.icon ? (
            <>
              <IconComponent iconName={config.settings.icon} />
            </>
          ) : (
            <span>None</span>
          )}
          <button
            onClick={() => setConfig((prev) => ({ ...prev, editIcon: true }))}
          >
            <PencilIcon className="icon fill" />
          </button>
          <button
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                settings: { ...prev.settings, icon: undefined },
              }))
            }
          >
            <TrashIcon className="icon stroke" />
          </button>
        </label> */}
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

        <HotkeyWrapper
          hotkey={config.settings.hotkey}
          onListen={() =>
            setConfig((prev) => ({ ...prev, listeningForHotkey: true }))
          }
          onRemove={() =>
            setConfig((prev) => ({ ...prev, removeHotkey: true }))
          }
        />
        <div className="flex-gap">
          {config.settings.tags && config.settings.tags.length > 0 ? (
            JSON.stringify(config.settings.tags)
          ) : (
            <span>No Tags</span>
          )}
          <button
            onClick={() => setConfig((prev) => ({ ...prev, editTags: true }))}
          >
            <PencilIcon className="icon fill" />
          </button>
        </div>

        <Modal
          isOpen={config.editTags}
          onClose={() => setConfig((prev) => ({ ...prev, editTags: false }))}
          header={
            <>
              <PencilIcon className="icon fill" />
              <h2>Edit Sound Tags</h2>
            </>
          }
        >
          <div className="grid-gap">
            {allTags.map((t) => (
              <button
                key={t.id}
                style={{
                  background: config.settings.tags?.some(
                    (tag) => t.id === tag.id,
                  )
                    ? "red"
                    : "",
                }}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      tags: prev.settings.tags?.some((tag) => tag.id === t.id)
                        ? prev.settings.tags?.filter((tag) => t.id !== tag.id)
                        : [...prev.settings.tags!, t],
                    },
                  }))
                }
              >
                {t.name}
              </button>
            ))}
          </div>
          <div
            className="icon-btn"
            style={{ position: "absolute", top: 10, right: 50 }}
            onClick={() => setConfig((prev) => ({ ...prev, editTags: false }))}
          >
            <ArrowIcon className="icon stroke" />
          </div>
        </Modal>

        <Modal
          isOpen={config.helper}
          onClose={() => setConfig((prev) => ({ ...prev, helper: false }))}
          header={
            <>
              <QuestionIcon className="icon fill" />
              <h2>Sound Editor</h2>
            </>
          }
        >
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

        <HotkeyListenerModal
          allHotkeys={allHotkeys}
          remove={config.removeHotkey}
          listening={config.listeningForHotkey}
          onSave={(hotkey) =>
            setConfig((prev) => ({
              ...prev,
              settings: { ...prev.settings, hotkey },
            }))
          }
          onSaveClose={() =>
            setConfig((prev) => ({ ...prev, listeningForHotkey: false }))
          }
          onRemove={() =>
            setConfig((prev) => ({
              ...prev,
              settings: { ...prev.settings, hotkey: undefined },
            }))
          }
          onRemoveClose={() =>
            setConfig((prev) => ({ ...prev, removeHotkey: false }))
          }
        />
      </div>

      <div className="seperator" />

      <SoundClipEditor
        show={config.editSound}
        blob={blob}
        sound={sound}
        playSound={playSound}
        stopSound={stopSound}
        onChange={(data) =>
          setConfig((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...data },
          }))
        }
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
        <div
          className="icon-btn"
          onClick={() => setConfig((prev) => ({ ...prev, helper: true }))}
        >
          <QuestionIcon className="icon fill" />
        </div>
        <div
          className="icon-btn"
          onClick={() =>
            setConfig((prev) => ({ ...prev, editSound: !prev.editSound }))
          }
        >
          <MusicNoteIcon
            className="icon fill"
            style={{
              fill: config.editSound
                ? "oklch(from var(--base-color) calc(l * 0.5) c h)"
                : "",
            }}
          />
        </div>
        <div
          className="icon-btn"
          onClick={async () => {
            await handleSave();
            if (hotkey)
              window.electronAPI.registerHotkey(hotkey, {
                type: "sound",
                soundId: sound.id.toString(),
              });
          }}
        >
          <SaveIcon className="icon fill" />
        </div>
      </div>
    </>
  );
}
