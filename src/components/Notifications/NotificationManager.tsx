import { useEffect, useState } from "react";
import { useEventBus } from "../../contexts/GlobalEventContext";

import { type NotificationProps } from "./_types/notification";
import DropdownNotification from "./DropdownNotification";

import styles from "./_styles/Notification.module.css";

export default function NotificationManager() {
  const bus = useEventBus();

  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  useEffect(() => {
    const unsubscribeNew = bus.subscribe("new-notification", (notification) => {
      const n = notification as NotificationProps;

      const id = Date.now() + Math.random();

      const newNotification = { ...n, id, persistent: n.status === "ERROR" };

      setNotifications((prev) => [newNotification, ...prev]);

      if (!newNotification.persistent) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((noti) => noti.id !== id));
        }, 5500);
      }
    });

    const unsubscribeRemove = bus.subscribe("remove-notification", (id) => {
      setNotifications((prev) => prev.filter((noti) => noti.id !== id));
    });

    return () => {
      unsubscribeNew();
      unsubscribeRemove();
    };
  }, [bus]);

  return (
    <div
      className={styles["notifications-wrapper"]}
      style={{ pointerEvents: notifications.length > 0 ? "auto" : "none" }}
    >
      {notifications.map((n) => (
        <DropdownNotification key={n.id} notification={n} />
      ))}
    </div>
  );
}
