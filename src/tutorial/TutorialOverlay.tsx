import { useEffect, useMemo, useState } from "react";
import { useTutorial } from "./TutorialContext";
import styles from "./_styles/Tutorial.module.css";

export default function TutorialOverlay() {
  const { state, next, stop } = useTutorial();

  const flow = state.flows?.[state.currentFlowId];
  const step = flow?.steps?.[state.stepIndex];

  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const hasTarget = !!targetEl && !!rect;

  // ----------------------------------------
  // Tooltip positioning
  // ----------------------------------------
  const tooltipStyle = useMemo(() => {
    if (!rect) {
      return {
        top: "25%",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }

    const gap = 12;

    switch (step?.placement) {
      case "top":
        return {
          top: rect.top - gap,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, -100%)",
        };

      case "left":
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - gap,
          transform: "translate(-100%, -50%)",
        };

      case "right":
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + gap,
          transform: "translateY(-50%)",
        };

      case "bottom":
      default:
        return {
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
        };
    }
  }, [rect, step?.placement]);

  // ----------------------------------------
  // Reset on step change
  // ----------------------------------------
  useEffect(() => {
    setTargetEl(null);
    setRect(null);
  }, [state.currentFlowId, state.stepIndex]);

  // ----------------------------------------
  // Find target element
  // ----------------------------------------
  useEffect(() => {
    if (!state.active || !step?.target) {
      setTargetEl(null);
      return;
    }

    let raf: number;
    let attempts = 0;
    const maxAttempts = 120;

    const find = () => {
      const el = document.querySelector(step.target) as HTMLElement | null;

      if (el) {
        setTargetEl(el);
        return;
      }

      attempts++;

      if (attempts < maxAttempts) {
        raf = requestAnimationFrame(find);
      } else {
        setTargetEl(null);
      }
    };

    find();

    return () => cancelAnimationFrame(raf);
  }, [state.active, step]);

  // ----------------------------------------
  // Track position
  // ----------------------------------------
  useEffect(() => {
    if (!state.active || !targetEl) return;

    const update = () => {
      if (!document.body.contains(targetEl)) {
        setTargetEl(null);
        setRect(null);
        return;
      }

      setRect(targetEl.getBoundingClientRect());
    };

    update();

    const observer = new ResizeObserver(update);

    observer.observe(targetEl);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [state.active, targetEl]);

  // ----------------------------------------
  // Click target mode
  // ----------------------------------------
  useEffect(() => {
    if (!state.active || !targetEl || step?.advance !== "click-target") {
      return;
    }

    const handler = (e: MouseEvent) => {
      if (targetEl.contains(e.target as Node)) {
        next();
      }
    };

    document.addEventListener("click", handler, true);

    return () => {
      document.removeEventListener("click", handler, true);
    };
  }, [state.active, targetEl, step, next]);

  // ----------------------------------------
  // Auto advance
  // ----------------------------------------
  useEffect(() => {
    if (!state.active || step?.advance !== "auto") return;

    const timeout = setTimeout(next, step.delayMs ?? 1500);

    return () => clearTimeout(timeout);
  }, [state.active, step, next]);

  if (!state.active || !step) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      {hasTarget && (
        <div
          className={styles.highlight}
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      <div className={`${styles.tooltip} grid-gap`} style={tooltipStyle}>
        <p>{step.text}</p>

        <div
          className={`${styles.controls} flex-gap`}
          style={{ justifyContent: "center" }}
        >
          <button onClick={stop}>Skip</button>

          {(step.advance !== "click-target" || !hasTarget) && (
            <button onClick={next}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
