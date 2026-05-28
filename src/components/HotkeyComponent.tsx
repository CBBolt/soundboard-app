import { formatHotkeyParts } from "../lib/hotkey";
import styles from "../styles/HotkeyComponent.module.css";

export default function HotkeyComponent({
  hotkey,
  compact = false,
}: {
  hotkey: Hotkey;
  compact?: boolean;
}) {
  const hotkeyElements = formatHotkeyParts(hotkey);

  return (
    <div className={styles.wrapper}>
      {hotkeyElements.map((el, index) => (
        <div key={index} className={styles.wrapper}>
          <div className={`${styles.key} ${compact ? styles.small : ""}`}>
            {compact ? el.slice(0, 2) : el}
          </div>
          {index < hotkeyElements.length - 1 && <span>+</span>}
        </div>
      ))}
    </div>
  );
}
