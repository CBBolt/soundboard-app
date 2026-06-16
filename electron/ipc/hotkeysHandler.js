import { ipcMain, globalShortcut } from "electron";

import { registerHotkey } from "../helpers/hotkeys.js";

export function registerHotkeysHandlers(mainWindow) {
  ipcMain.handle("register-hotkey", (_, hotkey, soundId) => {
    registerHotkey(mainWindow, hotkey, soundId);
  });

  ipcMain.handle("unregister-hotkeys", () => {
    globalShortcut.unregisterAll();
  });
}
