type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  lockedCondition?: boolean;
};

import styles from "../../styles/Modal.module.css";

export default function Modal({
  isOpen,
  onClose,
  lockedCondition,
  header,
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

        {children}
      </div>
    </div>
  );
}
