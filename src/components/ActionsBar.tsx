import CircleIcon from "../icons/CircleIcon";
import FolderIcon from "../icons/FolderIcon";
import GearIcon from "../icons/GearIcon";
import PlusIcon from "../icons/PlusIcon";
import QuestionIcon from "../icons/QuestionIcon";
import SquareIcon from "../icons/SquareIcon";
import HotkeyComponent from "./HotkeyComponent";
import HoverDropdown from "./HoverDropdown";

type Props = {
  VBDetected: { vbCable: boolean; voicemeter: boolean };
  addSound: () => void;
  startRecord: () => void;
  stopAll: () => void;
  instructions: () => void;
  settings: () => void;
};

export default function ActionsBar({
  VBDetected,
  addSound,
  startRecord,
  stopAll,
  instructions,
  settings,
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
        <span style={{ fontSize: "small" }}>V 1.0.0</span>
      </div>
      <div className="flex-gap">
        <HoverDropdown
          label={<PlusIcon className="icon sml fill" />}
          items={[
            {
              label: (
                <div className="flex-gap">
                  <FolderIcon className="icon sml stroke" />
                  <span>From File</span>
                </div>
              ),
              button: true,
              onClick: addSound,
            },
            {
              label: (
                <div className="flex-gap">
                  <CircleIcon className="icon sml fill" />
                  <span>Record New</span>
                </div>
              ),
              button: true,
              onClick: startRecord,
            },
          ]}
        />
        <HoverDropdown
          label={<QuestionIcon className="icon sml fill" />}
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
                        background: VBDetected.voicemeter ? "lime" : "red",
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
              label: <>Getting Started</>,
              button: true,
              onClick: instructions,
            },
          ]}
        />
        <button onClick={settings}>
          <GearIcon className="icon stroke" />
        </button>
        <button onClick={stopAll}>
          <div className="flex-gap">
            <SquareIcon className="icon fill" />
            <span>All</span>
            <HotkeyComponent hotkey={{ key: "Esc", shift: true }} />
          </div>
        </button>
      </div>
    </div>
  );
}
