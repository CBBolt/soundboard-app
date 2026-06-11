type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  lockedCondition?: boolean;
};

import styles from "../../styles/Modal.module.css";

export default function Modal({
  isOpen,
  onClose,
  lockedCondition,
  children,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className={styles["modal-overlay"]}
      onClick={() => {
        if (lockedCondition) return;
        onClose();
      }}
      style={{ background: lockedCondition ? "red" : "" }}
    >
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles["modal-close"]}
          onClick={() => {
            if (lockedCondition) return;
            onClose();
          }}
        >
          ×
        </button>

        {children}
      </div>
    </div>
  );
}
