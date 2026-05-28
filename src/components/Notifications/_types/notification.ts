export type NotificationProps = {
  id: number;
  message: string;
  status: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  persistent: boolean;
};
