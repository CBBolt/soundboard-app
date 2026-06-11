import { useCallback } from "react";

type VolumeSliderProps = {
  value: number;
  onChange: (value: number) => void;

  orientation?: "horizontal" | "vertical";

  min?: number;
  max?: number;

  width?: number;
  height?: number;

  showValue?: boolean;
  percentage?: boolean;
};

export default function VolumeSlider({
  value,
  onChange,

  orientation = "horizontal",

  min = 0,
  max = 1,

  width = 300,
  height = 28,

  showValue = true,
  percentage = true,
}: VolumeSliderProps) {
  const isVertical = orientation === "vertical";

  // -----------------------------
  // Normalize incoming value → 0..1
  // -----------------------------
  const normalized = percentage
    ? Math.min(1, Math.max(0, value)) // already 0–1
    : Math.min(1, Math.max(0, (value - min) / (max - min)));

  const percent = normalized * 100;

  // -----------------------------
  // Pointer handling
  // -----------------------------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      const rect = el.getBoundingClientRect();

      const update = (clientX: number, clientY: number) => {
        let next = 0;

        if (isVertical) {
          const y = rect.bottom - clientY;
          next = Math.min(1, Math.max(0, y / rect.height));
        } else {
          const x = clientX - rect.left;
          next = Math.min(1, Math.max(0, x / rect.width));
        }

        // -----------------------------
        // Output conversion
        // -----------------------------
        const outValue = percentage ? next : min + next * (max - min);

        onChange(outValue);
      };

      update(e.clientX, e.clientY);

      const move = (ev: PointerEvent) => update(ev.clientX, ev.clientY);

      const up = () => {
        el.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [isVertical, min, max, onChange, percentage],
  );

  // -----------------------------
  // Styles
  // -----------------------------
  const trackStyle: React.CSSProperties = {
    position: "relative",

    width: isVertical ? 10 : width,
    height: isVertical ? height : 10,

    borderRadius: 6,

    background: isVertical
      ? "linear-gradient(to top, #ff3b3b 0%, #ffcc00 40%, #00ff88 100%)"
      : "linear-gradient(to right, #ff3b3b 0%, #ffcc00 40%, #00ff88 100%)",

    boxShadow: "inset 0 0 4px rgba(0,0,0,0.6)",
    cursor: isVertical ? "ns-resize" : "ew-resize",
  };

  const thumbStyle: React.CSSProperties = {
    position: "absolute",

    left: isVertical ? "50%" : `${percent}%`,
    bottom: isVertical ? `${percent}%` : "50%",

    transform: "translate(-50%, 50%)",

    width: isVertical ? 22 : 14,
    height: isVertical ? 14 : 22,

    background: "#111",
    borderRadius: 5,
    border: "1px solid white",
    pointerEvents: "none",
  };

  // -----------------------------
  // Display value
  // -----------------------------
  const displayValue = percentage
    ? `${(normalized * 100).toFixed(0)}%`
    : `${value.toFixed(1)} DB`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={trackStyle} onPointerDown={handlePointerDown}>
        <div style={thumbStyle} />
      </div>

      {showValue && (
        <span style={{ minWidth: 50, textAlign: "center" }}>
          {displayValue}
        </span>
      )}
    </div>
  );
}
