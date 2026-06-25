import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GlobalEventProvider } from "./contexts/GlobalEventContext.tsx";
import { TutorialProvider } from "./tutorial/TutorialContext.tsx";
import TutorialOverlay from "./tutorial/TutorialOverlay.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalEventProvider>
      <TutorialProvider>
        <App />
        <TutorialOverlay />
      </TutorialProvider>
    </GlobalEventProvider>
  </StrictMode>,
);
