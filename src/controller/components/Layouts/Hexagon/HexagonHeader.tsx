import { useRef } from "react";
import { useContainerWidth } from "../../../../lib/helpers";

import HotkeyComponent from "../../../../components/Hotkey/HotkeyComponent";

import { Icon } from "@iconify/react";
import SquareIcon from "../../../../icons/SquareIcon";

type HeaderProps = {
  settings: Settings;
  tileSize: number;
  onSetTileSize: (number: number) => void;
};

export default function HexagonHeader({
  settings,
  tileSize,
  onSetTileSize,
}: HeaderProps) {
  const ref = useRef<HTMLDivElement>(null!);
  const width = useContainerWidth(ref);

  return (
    <div
      ref={ref}
      className="titlebar grid-gap"
      style={{
        placeItems: "center",
        gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
      }}
    >
      <div className="grabber" style={{ top: -20, left: "50%", zIndex: 1000 }}>
        <Icon
          icon="mdi:cursor-move"
          className="icon"
          style={{ color: "white" }}
        />
      </div>
      <div
        className="flex-gap icon-btn"
        style={{ padding: 2 }}
        onClick={() => window.electronAPI.sendSound("STOP_ALL")}
      >
        <SquareIcon className="icon fill sml" style={{ fill: "tomato" }} />
        {width > 300 && settings && (
          <HotkeyComponent hotkey={settings.stopHotkey} compact={true} />
        )}
      </div>
      <label
        className="flex-gap"
        style={{ fontSize: "smaller", color: "white" }}
      >
        {width > 300 ? "Size:" : ""}
        <input
          type="range"
          min={30}
          max={100}
          step={10}
          value={tileSize}
          onChange={(e) => onSetTileSize(Number(e.target.value))}
        />
      </label>
      <button
        style={{ color: "black" }}
        onClick={() => window.electronAPI.hideController()}
      >
        X
      </button>
    </div>
  );
}
