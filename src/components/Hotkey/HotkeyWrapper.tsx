import HotkeyIcon from "../../icons/HotkeyIcon";
import TrashIcon from "../../icons/TrashIcon";
import HotkeyComponent from "./HotkeyComponent";

type Props = {
  hotkey: Hotkey | undefined;
  onListen: () => void;
  onRemove: () => void;
};

export default function HotkeyWrapper({ hotkey, onListen, onRemove }: Props) {
  return (
    <div
      className="wrapper"
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {hotkey ? (
        <HotkeyComponent hotkey={hotkey} />
      ) : (
        <span>No hotkey assigned</span>
      )}
      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <div className="icon-btn" onClick={onListen}>
          <HotkeyIcon className="icon fill" />
        </div>
        {hotkey && (
          <div className="icon-btn" onClick={onRemove}>
            <TrashIcon className="icon stroke" />
          </div>
        )}
      </div>
    </div>
  );
}
