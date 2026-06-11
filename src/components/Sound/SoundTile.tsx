import { getContrastTextColor } from "../../lib/helpers";

import PencilIcon from "../../icons/PencilIcon";
import TrashIcon from "../../icons/TrashIcon";

import styles from "../../styles/SoundTile.module.css";
import HotkeyComponent from "../Hotkey/HotkeyComponent";

type Props = {
  sound: Sound;
  playSound: (sound: Sound, options: Partial<Sound>) => void;
  editSound: (sound: Sound) => void;
  deleteSound: (id: number) => void;
};

export default function SoundTile({
  sound,
  playSound,
  editSound,
  deleteSound,
}: Props) {
  const text = getContrastTextColor(sound.color ?? "#ffffff");

  return (
    <div
      className={styles.tile}
      style={{
        backgroundColor: sound.color ?? "white",
        color: text,
      }}
      onClick={() => playSound(sound, { ...sound })}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${(1 - (sound.gain ?? 0.5)) * 100}%`,
          opacity: 0.5,
          background: "black",
          transition: "height 100ms linear",
        }}
      />
      <div
        className={styles["tile-editor"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["edit-btns"]}>
          <div className="icon-btn" onClick={async () => editSound(sound)}>
            <PencilIcon className="icon sml fill" />
          </div>
          <div className="icon-btn" onClick={() => deleteSound(sound.id)}>
            <TrashIcon className="icon sml stroke" />
          </div>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          className={`${sound.name.length > 10 ? styles["scroll-text"] : ""}`}
        >
          {sound.name}
        </div>
        {sound.hotkey && (
          <HotkeyComponent hotkey={sound.hotkey} compact={true} />
        )}
      </div>
    </div>
  );
}
