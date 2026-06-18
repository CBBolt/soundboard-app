import { useEffect, useState } from "react";

import styles from "./_styles/BoardScroller.module.css";

type ScrollerProps = {
  boards: Board[];
  curBoardId: number;
  onSelect: (id: number) => void;
};

const VISIBLE_COUNT = 3;

export default function BoardScroller({
  boards,
  curBoardId,
  onSelect,
}: ScrollerProps) {
  const [startIndex, setStartIndex] = useState(0);

  let visibleBoards = boards.slice(startIndex, startIndex + VISIBLE_COUNT);

  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + VISIBLE_COUNT < boards.length;

  useEffect(() => {
    const maxStartIndex = Math.max(0, boards.length - VISIBLE_COUNT);

    setStartIndex((current) => Math.min(current, maxStartIndex));
  }, [boards.length]);

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
          gridTemplateColumns: `repeat(${VISIBLE_COUNT}, 120px)`,
          width: "100%",
        }}
      >
        {visibleBoards.map((b) => (
          <button
            className={styles.tile}
            key={b.id}
            style={{ background: curBoardId === b.id ? "red" : "" }}
            onClick={() => onSelect(b.id)}
          >
            <div className={styles.truncated}>{b.name}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() =>
          setStartIndex((i) => Math.min(boards.length - VISIBLE_COUNT, i + 1))
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
