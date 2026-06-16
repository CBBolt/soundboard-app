import { globalShortcut } from "electron";

import { toggleController } from "../ipc/controllerHandler.js";

export function registerHotkey(mainWindow, hotkey, data) {
  if (!isValidHotkey(hotkey)) {
    console.warn("Skipping invalid hotkey", data, hotkey);
    return;
  }

  const key = serializeHotkey(hotkey);

  if (!key) {
    console.warn("Failed to serialize hotkey", hotkey);
    return;
  }

  try {
    if (globalShortcut.isRegistered(key)) {
      globalShortcut.unregister(key);
    }

    globalShortcut.register(key, () => {
      if (data.type === "sound") {
        mainWindow.webContents.send("play-sound", data.soundId);
      } else if (data.type === "controller") {
        toggleController();
      }
    });
  } catch (err) {
    console.error("Failed to register hotkey:", key, err);
  }
}

function serializeHotkey(h) {
  const parts = [];

  if (h.ctrl) parts.push("CommandOrControl");
  if (h.shift) parts.push("Shift");
  if (h.alt) parts.push("Alt");

  const key = typeof h.key === "string" ? h.key.toUpperCase() : h.key;

  parts.push(key);

  return parts.join("+");
}

function isValidHotkey(h) {
  return h && typeof h.key === "string" && h.key.trim().length > 0;
}
