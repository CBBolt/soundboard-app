import { readData, writeData } from "../helpers/data.js";

const defaultSettings = {
  baseColor: "#ffffff",
  stopHotkey: { key: "esc", shift: true },
  controllerToggleHotkey: { key: "a", ctrl: true },
  baseTutorial: false,
  vmTutorial: false,
};

function applyDefaults(value, defaults) {
  if (value == null) {
    return structuredClone(defaults);
  }

  if (typeof defaults !== "object" || defaults === null) {
    return value;
  }

  const result = { ...value };

  for (const key of Object.keys(defaults)) {
    result[key] = applyDefaults(value[key], defaults[key]);
  }

  return result;
}

export function readSettings(settingsPath) {
  const settings = readData(settingsPath, defaultSettings);

  return applyDefaults(settings, defaultSettings);
}

export function updateSettings(settingsPath, settings) {
  const current = readSettings(settingsPath);

  const updated = {
    ...current,
    ...settings,
  };

  writeData(settingsPath, updated);
}
