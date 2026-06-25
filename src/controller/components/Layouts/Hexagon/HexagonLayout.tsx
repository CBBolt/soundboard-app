import { useRef, useState } from "react";
import styles from "./_styles/Hexagon.module.css";
import HexagonTile from "./HexagaonTile";
import HexagonHeader from "./HexagonHeader";
import { useContainerWidth } from "../../../../lib/helpers";

type HexagonLayoutProps = {
  sounds: (Sound | null)[];
  settings: Settings;
};

export default function HexagonLayout({
  sounds,
  settings,
}: HexagonLayoutProps) {
  const [tileSize, setTileSize] = useState(70);
  const ref = useRef<HTMLDivElement>(null!);

  function chunk<T>(arr: T[], size: number) {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  const width = useContainerWidth(ref);
  const columns = Math.max(1, Math.floor(width / (tileSize * 1.2)));
  const rows = chunk(sounds, columns);

  return (
    <div ref={ref} className={styles.board}>
      <HexagonHeader
        settings={settings}
        tileSize={tileSize}
        onSetTileSize={(num) => setTileSize(num)}
      />
      <div style={{ flex: 1, overflow: "auto", padding: 5 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className={styles.row}
            style={{
              marginLeft: i % 2 === 1 ? tileSize * 0.6 : "0px",
              gap: tileSize * 0.12,
            }}
          >
            {row.map((sound, i) => (
              <HexagonTile
                key={`${sound?.id ?? i}-${i}`}
                sound={sound}
                tileSize={tileSize}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
