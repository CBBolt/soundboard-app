type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

import styles from "../../styles/Modal.module.css";

export default function Modal({ isOpen, onClose, children }: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles["modal-close"]} onClick={onClose}>
          ×
        </button>

        {children}
      </div>
    </div>
  );
}
