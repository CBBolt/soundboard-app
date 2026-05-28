import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GlobalEventProvider } from "./contexts/GlobalEventContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalEventProvider>
      <App />
    </GlobalEventProvider>
  </StrictMode>,
);
