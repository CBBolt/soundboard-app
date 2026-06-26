import { useState } from "react";

import HotkeyComponent from "../../../../components/Hotkey/HotkeyComponent";

import { Icon } from "@iconify/react";
import SquareIcon from "../../../../icons/SquareIcon";

import styles from "./_styles/Radial.module.css";

type RadialControlProps = {
  settings: Settings;
  size: number;
  ring: {
    count: number;
    cur: number;
  };
  onPrev: () => void;
  onNext: () => void;
  hexagon: boolean;
};

export default function RadialControl({
  settings,
  size,
  ring,
  onPrev,
  onNext,
  hexagon,
}: RadialControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={styles.wrapper}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          setOpen(false);
        }}
        style={
          {
            "--size": `${size}px`,
          } as React.CSSProperties
        }
      >
        <div className={`${styles.control} ${hexagon ? styles.hex : ""}`} />

        <div className={`${styles.hover} ${open ? styles.open : ""}`}>
          {/* TOP */}
          <div
            className={styles.topLabel}
            onClick={() => window.electronAPI.sendSound("STOP_ALL")}
          >
            <button className="icon-btn">
              <SquareIcon className="icon sml" style={{ fill: "tomato" }} />
            </button>
            {settings && (
              <HotkeyComponent hotkey={settings.stopHotkey} compact={true} />
            )}
          </div>

          {/* MIDDLE ROW */}
          <div className={styles.middleRow}>
            <button onClick={onPrev} disabled={ring.cur === 0}>
              ‹
            </button>

            <div className={styles.center} />

            <button onClick={onNext} disabled={ring.cur === ring.count - 1}>
              ›
            </button>
          </div>

          {/* BOTTOM */}
          <div
            className={styles.bottom}
            onClick={() => window.electronAPI.hideController()}
          >
            <button className={styles.stopBtn}>
              <Icon icon="mdi:close" />
            </button>
          </div>
        </div>
      </div>
      <div
        className="grabber"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Icon icon="mdi:cursor-move" className="icon" />
      </div>
    </>
  );
}
