import { useEffect, useState } from "react";

import styles from "./_styles/Carousel.module.css";
import { getContrastTextColor } from "../../lib/helpers";

type CarouselProps<T extends { id: number; name: string; color?: string }> = {
  items: T[];
  curItemId: number;
  onSelect: (id: number) => void;

  maxItems?: number;
  isHighlighted?: (item: T) => boolean;
};

export default function Carousel<
  T extends { id: number; name: string; color?: string },
>({
  items,
  curItemId,
  onSelect,
  maxItems = 3,
  isHighlighted,
}: CarouselProps<T>) {
  const [startIndex, setStartIndex] = useState(0);

  let visibleItems = items.slice(startIndex, startIndex + maxItems);

  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + maxItems < items.length;

  useEffect(() => {
    const maxStartIndex = Math.max(0, items.length - maxItems);

    setStartIndex((current) => Math.min(current, maxStartIndex));
  }, [items.length]);

  return (
    <div className="flex-gap grey" style={{ padding: 5, borderRadius: 5 }}>
      <button
        onClick={() => setStartIndex((i) => Math.max(0, i - 1))}
        disabled={!canGoPrev}
        style={{
          width: 30,
          height: 30,
          display: "flex",
          justifyContent: "center",
        }}
      >
        &lt;
      </button>

      <div
        className="grid-gap"
        style={{
          gridTemplateColumns: `repeat(${maxItems}, 120px)`,
          width: "100%",
        }}
      >
        {visibleItems.map((v) => {
          const highlighted = isHighlighted
            ? isHighlighted(v)
            : curItemId === v.id;

          return (
            <button
              className={styles.tile}
              key={v.id}
              style={{
                border: highlighted ? "2px solid white" : "",
                color:
                  highlighted && v.color ? getContrastTextColor(v.color) : "",
                background: highlighted
                  ? (v.color ?? "")
                  : "oklch(from var(--base-color) calc(l * 0.9) c h)",
              }}
              onClick={() => onSelect(v.id)}
            >
              <div className={styles.truncated}>{v.name}</div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() =>
          setStartIndex((i) => Math.min(items.length - maxItems, i + 1))
        }
        disabled={!canGoNext}
        style={{
          width: 30,
          height: 30,
          display: "flex",
          justifyContent: "center",
        }}
      >
        &gt;
      </button>
    </div>
  );
}
