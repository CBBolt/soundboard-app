import { useEffect, useRef, useState } from "react";

import styles from "./_styles/Marquee.module.css";

type MarqueeProps = {
  text: string;
  className?: string;
  speed?: number;
};

export default function Marquee({
  text,
  className = "",
  speed = 8,
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;

    if (!container || !textEl) return;

    setShouldAnimate(textEl.scrollWidth > container.clientWidth);
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`${styles["marquee-container"]} ${className}`}
    >
      <span
        ref={textRef}
        className={`${styles["marquee-text"]} ${shouldAnimate ? styles.animate : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {text}
      </span>
    </div>
  );
}
