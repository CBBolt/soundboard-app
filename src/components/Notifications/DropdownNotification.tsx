import { useEffect, useRef } from "react";
import { useEventBus } from "../../contexts/GlobalEventContext";

import styles from "./_styles/Notification.module.css";
import type { NotificationProps } from "./_types/notification";

export default function DropdownNotification({
  notification,
}: {
  notification: NotificationProps;
}) {
  const bus = useEventBus();
  const { id, message, status, persistent } = notification;

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notificationRef.current) {
      setTimeout(
        () => notificationRef.current?.classList.add(styles.show),
        100,
      );

      if (!persistent) {
        setTimeout(
          () => notificationRef.current?.classList.remove(styles.show),
          3000,
        );
      }
    }
  }, [persistent]);

  return (
    <div ref={notificationRef} className={`${styles["notification"]}`}>
      <div className={`${styles["notification-bg"]} ${styles[status]}`} />
      <div className={styles["notification-body"]}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            bus.emit("remove-notification", id);
          }}
        >
          X
        </button>
        <span>{message}</span>
      </div>
    </div>
  );
}
