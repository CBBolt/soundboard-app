import { useRef, useState } from "react";
import HeadphoneIcon from "../icons/HeadphoneIcon";
import VoiceMeeterPanel from "./VoiceMeeter/VoiceMeeterPanel";
import VMDeviceSelector from "./VoiceMeeter/VMDeviceSelector";
import LoadIcon from "../icons/LoadIcon";
import { useContainerWidth } from "../lib/helpers";

type SidebarItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

type SidebarProps = {
  curItem: "BOARD" | "TAG" | "SOUND";
  items: SidebarItem[];
  defaultOpen?: boolean;
  loadedBoard?: Board;
  voiceMeeter: {
    currentInput: VMAudioDevice;
    currentOuput: VMAudioDevice;
    currentLocalOutput: string;
    toVoiceMeeter: boolean;
    outputDevices: AudioDevice[];
    inputDevices: AudioDevice[];
    loadDevices: () => void;
    getVMConfig: () => object;
    onToggle: () => void;
    onVoiceMeeterChange: ({
      currentInputDevice,
      currentOutputDevice,
    }: {
      currentInputDevice: VMAudioDevice;
      currentOutputDevice: VMAudioDevice;
    }) => void;
    onLocalChange: (value: string) => void;
  };
};

export default function SideBar({
  curItem,
  items,
  defaultOpen = false,
  loadedBoard,
  voiceMeeter,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const ref = useRef<HTMLDivElement>(null!);
  const width = useContainerWidth(ref);

  return (
    <aside
      data-tour="sidebar-menu"
      tour-cond={curItem}
      ref={ref}
      style={{
        position: "relative",
        width: isOpen ? "300px" : 40,
        transition: "width 0.2s ease",
        borderRight: "1px solid #ddd",
        background: "rgba(0, 0, 0, 0.5)",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setIsOpen((open) => !open)}
        data-tour="sidebar-button"
        tour-cond={isOpen ? "open" : "closed"}
        style={{
          width: "100%",
          padding: "12px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {isOpen ? "◀" : "▶"}
      </button>

      {isOpen && (
        <>
          <nav>
            {items.map((item) => {
              const content = (
                <>
                  {item.icon && <span>{item.icon}</span>}
                  {width > 200 && <span>{item.label}</span>}
                </>
              );

              return (
                <button
                  key={item.id}
                  data-tour={`${item.id}-button`}
                  onClick={item.onClick}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    margin: "5px 0",
                    cursor: "pointer",
                    textAlign: "left",
                    border: curItem === item.id ? "2px solid white" : "",
                  }}
                >
                  {content}
                </button>
              );
            })}
          </nav>

          <div
            className="grid-gap"
            style={{ position: "absolute", bottom: 10 }}
          >
            {loadedBoard && (
              <div
                className="flex-gap"
                style={{
                  border: "2px solid white",
                  padding: 5,
                  borderRadius: 5,
                }}
              >
                <LoadIcon className="icon fill stroke" />
                {loadedBoard.name}
              </div>
            )}
            <div className="flex-gap" data-tour="vm-panel">
              <button
                className="icon-btn grey"
                onClick={voiceMeeter.onToggle}
                data-tooltip={
                  voiceMeeter.toVoiceMeeter
                    ? "Switch to Local Output"
                    : "Switch to VoiceMeeter Output"
                }
                data-tour="vm-toggle"
                tour-cond={voiceMeeter.toVoiceMeeter ? "vm" : "local"}
              >
                <HeadphoneIcon
                  className="icon fill"
                  style={{
                    fill: !voiceMeeter.toVoiceMeeter
                      ? "oklch(from var(--base-color) calc(l * 0.75) c h)"
                      : "",
                    stroke: !voiceMeeter.toVoiceMeeter ? "var(--text)" : "",
                  }}
                />
              </button>
              {voiceMeeter.toVoiceMeeter ? (
                <VoiceMeeterPanel
                  outputDevices={voiceMeeter.outputDevices}
                  selectedOutputDevice={voiceMeeter.currentOuput}
                  inputDevices={voiceMeeter.inputDevices}
                  selectedInputDevice={voiceMeeter.currentInput}
                  loadVMConfig={voiceMeeter.getVMConfig}
                  onSave={(data) => voiceMeeter.onVoiceMeeterChange(data)}
                  loadDevices={voiceMeeter.loadDevices}
                />
              ) : (
                <VMDeviceSelector
                  currentDevice={voiceMeeter.currentLocalOutput}
                  devices={voiceMeeter.outputDevices}
                  onChange={(value: string) => voiceMeeter.onLocalChange(value)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
