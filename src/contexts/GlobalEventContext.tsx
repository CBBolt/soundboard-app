/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from "react";

type EventCallback = (...args: unknown[]) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] } = {};

  subscribe(event: string, callback: EventCallback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, ...args: unknown[]) {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(...args));
  }
}

const EventBusContext = createContext<EventBus | null>(null);

export const GlobalEventProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [eventBus] = React.useState(() => new EventBus());

  return (
    <EventBusContext.Provider value={eventBus}>
      {children}
    </EventBusContext.Provider>
  );
};

export const useEventBus = () => {
  const context = useContext(EventBusContext);
  if (!context)
    throw new Error("useEventBus must be used within EventProvider");
  return context;
};
