import { Icon } from "@iconify/react";
import MusicNoteIcon from "../../../../icons/MusicNoteIcon";
import Marquee from "../../../../components/Marquee/Marquee";

import styles from "./_styles/Hexagon.module.css";
import HotkeyComponent from "../../../../components/Hotkey/HotkeyComponent";

type TilePrpos = {
  sound: Sound | null;
  tileSize: number;
};

export default function HexagonTile({ sound, tileSize }: TilePrpos) {
  return (
    <div
      className={styles.hex}
      style={{ width: tileSize, marginBottom: -(tileSize * 0.15) }}
      onClick={() => {
        if (!sound) return;
        window.electronAPI.sendSound(sound.id.toString());
      }}
    >
      {sound && (
        <div className="grid-gap">
          <div>
            {sound.icon ? (
              <Icon
                icon={sound.icon}
                className="icon fill"
                style={{
                  color: sound.color,
                  width: tileSize * 0.5,
                  height: tileSize * 0.5,
                }}
              />
            ) : (
              <MusicNoteIcon
                className="icon fill"
                style={{
                  fill: sound.color,
                  width: tileSize * 0.5,
                  height: tileSize * 0.5,
                }}
              />
            )}
          </div>
          {tileSize >= 90 && sound.hotkey && (
            <HotkeyComponent hotkey={sound.hotkey} compact={true} />
          )}
          {tileSize >= 100 && <Marquee text={sound.name} />}
        </div>
      )}
    </div>
  );
}
