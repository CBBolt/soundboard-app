import HotkeyComponent from "../../../../components/Hotkey/HotkeyComponent";

import { Icon } from "@iconify/react";
import SquareIcon from "../../../../icons/SquareIcon";

type HeaderProps = {
  settings: Settings;
  width: number;
  tileSize: number;
  onSetTileSize: (number: number) => void;
};

export default function BoardHeader({
  settings,
  width,
  tileSize,
  onSetTileSize,
}: HeaderProps) {
  return (
    <div
      className="titlebar grid-gap"
      style={{
        width: "100%",
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
        <SquareIcon className="icon sml" style={{ fill: "tomato" }} />
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
          max={200}
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
