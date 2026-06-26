import { useRef, useState } from "react";
import { useContainerWidth } from "../../../../lib/helpers";
import BoardTile from "./BoardTile";
import BoardHeader from "./BoardHeader";

type BoardLayoutProps = {
  settings: Settings;
  sounds: (Sound | null)[];
};

export default function BoardLayout({ settings, sounds }: BoardLayoutProps) {
  const [tileSize, setTileSize] = useState(100);

  const ref = useRef<HTMLDivElement>(null!);
  const width = useContainerWidth(ref);

  return (
    <div
      ref={ref}
      className="flex-gap"
      style={{ height: "100%", flexDirection: "column", overflow: "hidden" }}
    >
      <BoardHeader
        width={width}
        settings={settings}
        tileSize={tileSize}
        onSetTileSize={(num) => setTileSize(num)}
      />
      <div
        className="grid-gap"
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          padding: 5,
          overflow: "auto",
          alignContent: "start",
          gridTemplateColumns: `repeat(auto-fit, ${tileSize}px)`,
        }}
      >
        {sounds.map((s, i) => (
          <BoardTile key={`${s?.id ?? i}-${i}`} sound={s} tileSize={tileSize} />
        ))}
      </div>
    </div>
  );
}
