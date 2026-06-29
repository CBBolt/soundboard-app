import { useState } from "react";
import ArrowIcon from "../../icons/ArrowIcon";
import { isAllowedDevice } from "../../lib/helpers";

type VMDeviceProps = {
  currentDevice: VMAudioDevice | undefined;
  devices: AudioDevice[];
  onChange: (device: VMAudioDevice) => void;
  vmPanel?: boolean;
};

export default function VMDeviceDriverSelector({
  currentDevice,
  devices,
  onChange,
  vmPanel = false,
}: VMDeviceProps) {
  const [device, setDevice] = useState<VMAudioDevice>(
    currentDevice ?? {
      name: "",
      id: "",
      driver: "WDM",
    },
  );

  return (
    <div className="flex-gap">
      <select
        value={device.id}
        onChange={(e) =>
          setDevice((prev) => ({
            ...prev,
            name: devices.find((d) => d.id === e.target.value)?.label as string,
            id: e.target.value,
          }))
        }
      >
        <option value="">-- Select Device --</option>

        {devices
          .filter(isAllowedDevice)
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.label || `Device ${d.id}`}
            </option>
          ))}
      </select>
      <button
        onClick={() => {
          setDevice((prev) => ({
            ...prev,
            driver: prev.driver === "WDM" ? "MME" : "WDM",
          }));
        }}
        data-tooltip="Change Device Driver Type"
      >
        {device.driver}
      </button>
      <button
        onClick={() => onChange(device)}
        data-tooltip={vmPanel ? "Update VoiceMeeter Device" : undefined}
      >
        <ArrowIcon className="icon stroke" />
      </button>
    </div>
  );
}
