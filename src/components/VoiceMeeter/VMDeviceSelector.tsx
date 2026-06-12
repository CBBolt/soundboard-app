type VMDeviceProps = {
  currentDevice: string;
  devices: AudioDevice[];
  onChange: (value: string) => void;
};

export default function VMDeviceSelector({
  currentDevice,
  devices,
  onChange,
}: VMDeviceProps) {
  return (
    <select value={currentDevice} onChange={(e) => onChange(e.target.value)}>
      {devices
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((d) => (
          <option key={d.id} value={d.id}>
            {d.label || `Device ${d.id}`}
          </option>
        ))}
    </select>
  );
}
