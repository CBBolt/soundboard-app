import { useEffect, useRef, useState } from "react";
import { useEventBus } from "../../contexts/GlobalEventContext";

import styles from "./_styles/Notification.module.css";
import type { NotificationProps } from "./_types/notification";

export default function DropdownNotification({
  notification,
}: {
  notification: NotificationProps;
}) {
  const bus = useEventBus();
  const [visible, setVisible] = useState(false);
  const { id, message, status, persistent } = notification;

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true);

    if (!persistent) {
      const hide = setTimeout(() => setVisible(false), 3000);

      const remove = setTimeout(() => {
        bus.emit("remove-notification", id);
      }, 3250);

      return () => {
        clearTimeout(hide);
        clearTimeout(remove);
      };
    }
  }, [bus, id, persistent]);

  return (
    <div
      ref={notificationRef}
      className={`${styles.notification} ${visible ? styles.show : ""} ${styles[status]}`}
    >
      <div className={styles["notification-body"]}>
        <span className={styles.message}>{message}</span>
        <button
          className={styles["close-button"]}
          onClick={(e) => {
            e.stopPropagation();
            bus.emit("remove-notification", id);
          }}
        >
          X
        </button>
      </div>
    </div>
  );
}
