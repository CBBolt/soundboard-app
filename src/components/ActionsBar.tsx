import HotkeyComponent from "./Hotkey/HotkeyComponent";
import HoverDropdown from "./HoverDropdown";

import GearIcon from "../icons/GearIcon";
import OverlayIcon from "../icons/OverlayIcon";
import QuestionIcon from "../icons/QuestionIcon";
import SquareIcon from "../icons/SquareIcon";

type Props = {
  settings: Settings | undefined;
  VBDetected: VBDetected;
  overlay: boolean;
  stopAll: () => void;
  instructions: () => void;
  toggleOverlay: () => void;
  showSettings: () => void;
};

export default function ActionsBar({
  settings,
  VBDetected,
  overlay,
  stopAll,
  instructions,
  toggleOverlay,
  showSettings,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        background:
          "oklch(from var(--base-color) calc(l * 0.7) calc(c * 1.5) h)",
        borderRadius: "5px",
        boxShadow: "black 1px 1px 10px 1px",
        margin: "10px 0px",
      }}
    >
      <div>
        <h1 style={{ marginBottom: 0 }}>Soundboard</h1>
        <span style={{ fontSize: "small" }}>V 2.0.2</span>
      </div>
      <div className="flex-gap">
        <button
          onClick={toggleOverlay}
          className="grey"
          data-tooltip={
            overlay ? "Close Controller Overlay" : "Open Controller Overlay"
          }
          data-tour="overlay-controller"
        >
          <OverlayIcon
            className="icon fill sml"
            style={{
              fill: overlay ? "var(--base-color)" : "",
              stroke: overlay ? "white" : "",
            }}
          />
        </button>
        <HoverDropdown
          label={
            <QuestionIcon
              className="icon sml fill"
              data-tooltip="Help"
              data-tour="help"
            />
          }
          items={[
            {
              label: (
                <div className="panel">
                  <div className="flex-gap">
                    <div
                      style={{
                        background: VBDetected.vbCable ? "lime" : "red",
                        borderRadius: "100%",
                        height: "5px",
                        width: "5px",
                      }}
                    />
                    VB Cable
                  </div>
                  <div className="flex-gap">
                    <div
                      style={{
                        background: VBDetected.voicemeeter ? "lime" : "red",
                        borderRadius: "100%",
                        height: "5px",
                        width: "5px",
                      }}
                    />
                    VoiceMeeter
                  </div>
                </div>
              ),
            },
            {
              label: <>Help</>,
              button: true,
              dataTour: "help-btn",
              onClick: instructions,
            },
          ]}
        />
        <button
          onClick={showSettings}
          data-tooltip="Settings"
          data-tour="settings"
        >
          <GearIcon className="icon sml stroke" />
        </button>
        <button onClick={stopAll}>
          <div className="flex-gap">
            <SquareIcon className="icon fill sml" />
            <span>All</span>
            {settings && <HotkeyComponent hotkey={settings.stopHotkey} />}
          </div>
        </button>
      </div>
    </div>
  );
}
