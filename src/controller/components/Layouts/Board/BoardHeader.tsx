import { Icon } from "@iconify/react";
import HotkeyComponent from "../../../../components/Hotkey/HotkeyComponent";
import SquareIcon from "../../../../icons/SquareIcon";

type HeaderProps = {
  settings: Settings;
  tileSize: number;
  onSetTileSize: (number: number) => void;
};

export default function BoardHeader({
  settings,
  tileSize,
  onSetTileSize,
}: HeaderProps) {
  return (
    <div className="titlebar">
      <div className="grabber" style={{ top: -20, left: "50%", zIndex: 1000 }}>
        <Icon
          icon="mdi:cursor-move"
          className="icon"
          style={{ color: "white" }}
        />
      </div>
      <div
        className="titlebar-controls flex-gap"
        style={{ justifyContent: "space-between" }}
      >
        <div
          className="flex-gap icon-btn"
          onClick={() => window.electronAPI.sendSound("STOP_ALL")}
        >
          <SquareIcon className="icon fill sml" />
          <span>All</span>
          {settings && <HotkeyComponent hotkey={settings.stopHotkey} />}
        </div>
        <label
          className="flex-gap"
          style={{ fontSize: "smaller", color: "white" }}
        >
          Size:
          <input
            type="range"
            min={50}
            max={200}
            step={10}
            value={tileSize}
            onChange={(e) => onSetTileSize(Number(e.target.value))}
          />
        </label>
        <button onClick={() => window.electronAPI.hideController()}>X</button>
      </div>
    </div>
  );
}
