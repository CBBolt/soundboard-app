import { Icon } from "@iconify/react";
import MusicNoteIcon from "../../../../icons/MusicNoteIcon";
import HotkeyComponent from "../../../../components/Hotkey/HotkeyComponent";
import Marquee from "../../../../components/Marquee/Marquee";

import styles from "./_styles/Radial.module.css";

type RadialSoundProps = {
  size: number;
  x: number;
  y: number;
  sound: Sound | null;
  hexagon: boolean;
};

export default function RadialSound({
  size,
  x,
  y,
  sound,
  hexagon,
}: RadialSoundProps) {
  return (
    <div
      className={`${styles["radial-sound"]} ${!sound ? styles.empty : ""} ${hexagon ? styles.hex : ""}`}
      onClick={() => {
        if (!sound) return;
        window.electronAPI.sendSound(sound.id.toString());
      }}
      style={{
        width: size,
        height: size,
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
    >
      {sound && (
        <div>
          {sound.icon ? (
            <Icon
              icon={sound.icon}
              className="icon fill"
              style={{
                width: size * 0.9,
                height: size * 0.9,
                color: sound.color,
              }}
            />
          ) : (
            <MusicNoteIcon
              className="icon fill"
              style={{
                width: size * 0.9,
                height: size * 0.9,
                fill: sound.color,
              }}
            />
          )}
          {size > 30 && (
            <>
              {sound.hotkey && (
                <HotkeyComponent hotkey={sound.hotkey} compact={true} />
              )}
              <div className="grid-gap">
                <Marquee text={sound.name} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
