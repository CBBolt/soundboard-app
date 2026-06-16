import { ipcMain } from "electron";

import { readSettings, updateSettings } from "../storage/settings.js";

export function registerSettingsHandlers(settingsPath) {
  ipcMain.handle("get-settings", () => {
    return readSettings(settingsPath);
  });

  ipcMain.handle("update-settings", (_, partialSettings) => {
    updateSettings(settingsPath, partialSettings);
  });
}
