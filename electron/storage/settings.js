import { readData, writeData } from "../helpers/data.js";

const defaultSettings = {
  baseColor: "#ffffff",
  stopHotkey: { key: "esc", shift: true },
  controllerToggleHotkey: { key: "a", ctrl: true },
  baseTutorial: false,
  vmTutorial: false,
};

export function readSettings(settingsPath) {
  return readData(settingsPath, defaultSettings);
}

export function updateSettings(settingsPath, settings) {
  const current = readSettings(settingsPath);

  const updated = {
    ...current,
    ...settings,
  };

  writeData(settingsPath, updated);
}
