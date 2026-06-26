type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  locked?: { lockedCondition: boolean; lockedMessage: string };
};

import WarningIcon from "../../icons/WarningIcon";
import styles from "../../styles/Modal.module.css";
import { useTutorial } from "../../tutorial/TutorialContext";

export default function Modal({
  isOpen,
  onClose,
  locked,
  header,
  children,
}: Props) {
  const { state } = useTutorial();

  const flow = state.flows[state.currentFlowId];
  let canClose = false;

  if (flow) {
    const currentStep = flow.steps[state.stepIndex];
    const previousStep = flow.steps[state.stepIndex - 1];

    canClose = Boolean(currentStep?.closeModal || previousStep?.closeModal);
  }

  const isTutorialLocked = state.active && !canClose;

  if (!isOpen) return null;

  return (
    <div
      className={styles["modal-overlay"]}
      onClick={() => {
        if (locked?.lockedCondition || isTutorialLocked) return;
        onClose();
      }}
    >
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        {!locked?.lockedCondition && (
          <button
            data-tour="modal-close-btn"
            className={styles["modal-close"]}
            onClick={() => {
              if (locked?.lockedCondition || isTutorialLocked) return;
              onClose();
            }}
          >
            ×
          </button>
        )}

        {header && (
          <>
            <div
              className="flex-gap"
              style={{ position: "absolute", top: 10, left: 10 }}
            >
              {header}
            </div>
            <div className="seperator" />
          </>
        )}

        {locked && locked.lockedCondition && (
          <div className="flex-gap" style={{ justifyContent: "center" }}>
            <WarningIcon className="icon fill stroke" />
            <span>{locked.lockedMessage}</span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
