import { useEffect, useRef, useState } from "react";

import styles from "./_styles/GlobalTooltip.module.css";

type TooltipState = {
  visible: boolean;
  text: string;
  x: number;
  y: number;
};

const OFFSET = 12;
const SCREEN_PADDING = 8;

export default function GlobalTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: "",
    x: 0,
    y: 0,
  });

  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const show = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const text = target
        .closest("[data-tooltip]")
        ?.getAttribute("data-tooltip");

      if (!text) {
        setTooltip((prev) => ({ ...prev, visible: false }));
        return;
      }

      setTooltip({
        visible: true,
        text,
        x: e.clientX,
        y: e.clientY,
      });
    };

    const move = (e: MouseEvent) => {
      setTooltip((prev) =>
        prev.visible
          ? {
              ...prev,
              x: e.clientX,
              y: e.clientY,
            }
          : prev,
      );
    };

    document.addEventListener("mouseover", show);
    document.addEventListener("mousemove", move);

    return () => {
      document.removeEventListener("mouseover", show);
      document.removeEventListener("mousemove", move);
    };
  }, []);

  if (!tooltip.visible) return null;

  const tooltipWidth = tooltipRef.current?.offsetWidth ?? 0;
  const tooltipHeight = tooltipRef.current?.offsetHeight ?? 0;

  let left = tooltip.x + OFFSET;
  let top = tooltip.y + OFFSET;

  // Right edge
  if (left + tooltipWidth > window.innerWidth - SCREEN_PADDING) {
    left = tooltip.x - tooltipWidth - OFFSET;
  }

  // Left edge fallback
  if (left < SCREEN_PADDING) {
    left = SCREEN_PADDING;
  }

  // Bottom edge
  if (top + tooltipHeight > window.innerHeight - SCREEN_PADDING) {
    top = tooltip.y - tooltipHeight - OFFSET;
  }

  // Top edge fallback
  if (top < SCREEN_PADDING) {
    top = SCREEN_PADDING;
  }

  return (
    <div
      ref={tooltipRef}
      className={styles["global-tooltip"]}
      style={{
        left,
        top,
      }}
    >
      {tooltip.text}
    </div>
  );
}
