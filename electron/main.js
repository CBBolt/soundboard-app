import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  globalShortcut,
} from "electron";

import fs from "fs";
import path from "path";

import { spawn, execFile } from "child_process";

import { fileURLToPath } from "url";

import { registerSoundHandlers } from "./ipc/soundHandler.js";
import { registerSettingsHandlers } from "./ipc/settingsHandler.js";
import { registerBoardsHandlers } from "./ipc/boardsHandler.js";
import { registerTagsHandlers } from "./ipc/tagsHandler.js";

import { registerHotkeysHandlers } from "./ipc/hotkeysHandler.js";
import { registerVoiceMeeterHandlers } from "./ipc/voicemeeterHandler.js";
import { registerControllerHandlers } from "./ipc/controllerHandler.js";

// ======================================================
// PATHS
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = app.getPath("userData");

const soundsFolderPath = path.join(userDataPath, "sounds");
const soundsPath = path.join(userDataPath, "sounds.json");
const settingsPath = path.join(userDataPath, "settings.json");
const boardsPath = path.join(userDataPath, "boards.json");
const tagsPath = path.join(userDataPath, "tags.json");

// ======================================================
// VOICEMEETER BRIDGE
// ======================================================

const bridge = spawn("resources/voicemeeter-bridge.exe", [], {
  stdio: "pipe",
});

// Only use if needing to get stderr messages from Rust
// bridge.stderr.on("data", (data) => {
//   console.log("Rust:", data.toString());
// });

let buffer = "";
let queue = [];

bridge.stdout.on("data", (chunk) => {
  buffer += chunk.toString();

  let lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;

    let msg;
    try {
      msg = JSON.parse(line);
    } catch (e) {
      console.error("Bad JSON:", line);
      continue;
    }

    if (queue.length > 0) {
      const { resolve } = queue.shift();
      resolve(msg);
    }
  }
});

// ======================================================
// APP SETUP
// ======================================================

ensureStorage();

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  createWindow();

  registerIpcHandlers();

  const voicemeterPath =
    "C:\\Program Files (x86)\\VB\\Voicemeeter\\voicemeeter.exe";

  if (fs.existsSync(voicemeterPath)) {
    execFile(voicemeterPath);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    globalShortcut.unregisterAll();

    bridge.stdin.write(
      JSON.stringify({
        cmd: "logout",
      }) + "\n",
    );

    app.quit();
  }
});

// ======================================================
// WINDOW
// ======================================================

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, "../assets/icon.png"),

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    return;
  } else {
    mainWindow.loadFile(
      path.join(app.getAppPath(), "dist/renderer/index.html"),
    );
  }
}

// ======================================================
// IPC
// ======================================================

function registerIpcHandlers() {
  registerSoundHandlers(mainWindow, soundsFolderPath, soundsPath);
  registerSettingsHandlers(settingsPath);
  registerBoardsHandlers(boardsPath);
  registerTagsHandlers(tagsPath);

  registerHotkeysHandlers(mainWindow);
  registerVoiceMeeterHandlers(bridge, queue);
  registerControllerHandlers(mainWindow, __dirname);

  // ============================================
  // FILE PICKER
  // ============================================

  ipcMain.handle("pick-audio-file", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],

      filters: [
        {
          name: "Audio",

          extensions: ["mp3", "wav", "ogg", "flac"],
        },
      ],
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0];
  });
}

// ======================================================
// STORAGE
// ======================================================

function ensureStorage() {
  if (!fs.existsSync(soundsFolderPath)) {
    fs.mkdirSync(soundsFolderPath, {
      recursive: true,
    });
  }

  if (!fs.existsSync(soundsPath)) {
    fs.writeFileSync(soundsPath, "[]");
  }

  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, "[]");
  }

  if (!fs.existsSync(boardsPath)) {
    fs.writeFileSync(boardsPath, "[]");
  }

  if (!fs.existsSync(tagsPath)) {
    fs.writeFileSync(tagsPath, "[]");
  }
}
