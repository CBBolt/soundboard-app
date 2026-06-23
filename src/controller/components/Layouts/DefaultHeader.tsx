import { Icon } from "@iconify/react";
import HotkeyComponent from "../../../components/Hotkey/HotkeyComponent";
import SquareIcon from "../../../icons/SquareIcon";

type HeaderProps = {
  settings: Settings;
  stop?: boolean;
  onTop?: boolean;
};

export default function DefaultHeader({
  settings,
  onTop = false,
  stop = true,
}: HeaderProps) {
  return (
    <div
      className="titlebar flex-gap"
      style={{ position: onTop ? "fixed" : "relative", top: 0, zIndex: 5 }}
    >
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
        {stop && (
          <div
            className="flex-gap icon-btn"
            style={{ padding: 2 }}
            onClick={() => window.electronAPI.sendSound("STOP_ALL")}
          >
            <SquareIcon className="icon sml" style={{ fill: "tomato" }} />
            {settings && (
              <HotkeyComponent hotkey={settings.stopHotkey} compact={true} />
            )}
          </div>
        )}
        <button
          style={{ color: "black" }}
          onClick={() => window.electronAPI.hideController()}
        >
          X
        </button>
      </div>
    </div>
  );
}
