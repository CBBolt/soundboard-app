import { useState } from "react";
import ArrowIcon from "../../icons/ArrowIcon";

type VMDeviceProps = {
  currentDevice: VMAudioDevice | undefined;
  devices: AudioDevice[];
  onChange: (device: VMAudioDevice) => void;
};

export default function VMDeviceDriverSelector({
  currentDevice,
  devices,
  onChange,
}: VMDeviceProps) {
  const [device, setDevice] = useState<VMAudioDevice>(
    currentDevice ?? {
      name: devices[0].label,
      id: devices[0].id,
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
        {devices
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
      >
        {device.driver}
      </button>
      <button onClick={() => onChange(device)}>
        <ArrowIcon className="icon stroke" />
      </button>
    </div>
  );
}
