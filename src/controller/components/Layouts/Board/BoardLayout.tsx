import { useState } from "react";
import BoardTile from "./BoardTile";
import BoardHeader from "./BoardHeader";

type BoardLayoutProps = {
  settings: Settings;
  sounds: (Sound | null)[];
};

export default function BoardLayout({ settings, sounds }: BoardLayoutProps) {
  const [tileSize, setTileSize] = useState(100);

  return (
    <>
      <BoardHeader
        settings={settings}
        tileSize={tileSize}
        onSetTileSize={(num) => setTileSize(num)}
      />
      <div
        className="grid-gap"
        style={{
          overflow: "auto",
          gridTemplateColumns: `repeat(auto-fit, ${tileSize}px)`,
        }}
      >
        {sounds.map((s, i) => (
          <BoardTile key={s?.id ?? i} sound={s} tileSize={tileSize} />
        ))}
      </div>
    </>
  );
}
