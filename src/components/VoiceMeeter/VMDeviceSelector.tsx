type VMDeviceProps = {
  currentDevice: string | undefined;
  devices: AudioDevice[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function VMDeviceSelector({
  currentDevice,
  devices,
  disabled,
  onChange,
}: VMDeviceProps) {
  return (
    <select
      disabled={disabled}
      value={currentDevice}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">-- Select Device --</option>

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
