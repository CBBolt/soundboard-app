import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
  Menu,
} from "electron";

import fs from "fs";
import path from "path";
import os from "os";

import { spawn, exec, execFile } from "child_process";

import { fileURLToPath, pathToFileURL } from "url";

import ytdl from "@distube/ytdl-core";

// ======================================================
// PATHS
// ======================================================

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const userDataPath = app.getPath("userData");

const soundsPath = path.join(userDataPath, "sounds");

const jsonPath = path.join(userDataPath, "sounds.json");

const settingsPath = path.join(userDataPath, "settings.json");

const bridge = spawn("resources/voicemeeter-bridge.exe", [], {
  stdio: "pipe",
});

bridge.stderr.on("data", (data) => {
  console.log("Rust:", data.toString());
});

let buffer = "";
let queue = [];

bridge.stdout.on("data", (chunk) => {
  console.log(chunk.toString());

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
  // ======================================================
  // VB AUDIO
  // ======================================================

  ipcMain.handle("detect-vb-audio", async () => {
    return new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `
        @(
          Get-PnpDevice |
          Where-Object {
            $_.Manufacturer -like '*VB-Audio*'
          } |
          Select-Object Status, Class, FriendlyName, InstanceId
        ) | ConvertTo-Json
        `,
        ],
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }

          try {
            const devices = JSON.parse(stdout || "[]");

            // Always ensure array on JS side too
            resolve(Array.isArray(devices) ? devices : [devices]);
          } catch (e) {
            reject(e);
          }
        },
      );
    });
  });

  ipcMain.handle("disable-vb-audio", async () => {
    exec("control mmsys.cpl");
  });

  ipcMain.handle("open-voicemeeter", async () => {
    execFile("C:\\Program Files (x86)\\VB\\Voicemeeter\\voicemeeter.exe");
  });

  ipcMain.handle("vm-command", async (_, command) => {
    if (!bridge) {
      throw new Error("VM not running");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("VM command timeout"));
      }, 5000);

      queue.push({
        resolve: (data) => {
          clearTimeout(timeout);
          resolve(data);
        },
        reject,
      });

      bridge.stdin.write(JSON.stringify(command) + "\n");
    });
  });

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

  // ============================================
  // SAVE
  // ============================================

  ipcMain.handle("save-sound", async (_, filePath, metadata) => {
    return saveSoundFile({
      sourcePath: filePath,
      fileName: path.basename(filePath),
      originalName: path.basename(filePath),
      metadata,
    });
  });

  ipcMain.handle("save-recording", async (_, buffer, metadata) => {
    return saveSoundFile({
      buffer,
      fileName: `recording-${Date.now()}.wav`,
      metadata,
    });
  });

  // ============================================
  // YOUTUBE AUDIO DOWNLOAD
  // ============================================

  ipcMain.handle("add-youtube-audio", async (_, url) => {
    const outputTemplate = path.join(soundsPath, "%(title)s-%(id)s.%(ext)s");

    const meta = await getYoutubeMetadata(url);

    console.log(meta);

    const filePath = await downloadYoutube(url, outputTemplate);

    const sound = saveSoundFile({
      sourcePath: filePath,
      fileName: path.basename(filePath),
      originalName: path.basename(filePath),
      deleteSource: true,
      metadata: {
        duration: meta.duration,
        url,
      },
    });

    return sound;
  });

  // ============================================
  // HOTKEYS
  // ============================================

  ipcMain.handle("register-hotkey", async (_, hotkey, soundId) => {
    registerHotkey(hotkey, soundId);
  });

  ipcMain.handle("unregister-hotkeys", async (_, hotkey, soundId) => {
    globalShortcut.unregisterAll();
  });

  // ============================================
  // SOUND DATA
  // ============================================

  ipcMain.handle("get-sounds", async () => {
    return readSounds();
  });

  ipcMain.handle("get-sound-path", (_, fileName) => {
    return getSoundPath(fileName);
  });

  ipcMain.handle("get-file-url", (_, filePath) => {
    return pathToFileURL(filePath).href;
  });

  ipcMain.handle("read-sound", (_, filePath) => {
    return fs.readFileSync(filePath);
  });

  // ============================================
  // SETTINGS
  // ============================================

  ipcMain.handle("get-settings", () => {
    return readSettings();
  });

  ipcMain.handle("update-settings", (_, partialSettings) => {
    const current = readSettings();

    const updated = {
      ...current,
      ...partialSettings,
    };

    writeSettings(updated);

    return updated;
  });

  // ============================================
  // DELETE
  // ============================================

  ipcMain.handle("delete-sound", (_, id) => {
    const sounds = readSounds();

    const sound = sounds.find((s) => s.id === id);

    if (!sound) {
      return false;
    }

    const filePath = getSoundPath(sound.fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const updated = sounds.filter((s) => s.id !== id);

    writeSounds(updated);

    return true;
  });

  // ============================================
  // RENAME
  // ============================================

  ipcMain.handle("rename-sound", (_, { id, newName }) => {
    const sounds = readSounds();

    const sound = sounds.find((s) => s.id === id);

    if (!sound) {
      return null;
    }

    sound.name = newName;

    writeSounds(sounds);

    return sound;
  });

  // ============================================
  // UPDATE
  // ============================================

  ipcMain.handle("update-sound", (_, updated) => {
    const sounds = readSounds();

    const index = sounds.findIndex((s) => s.id === updated.id);

    if (index === -1) {
      return null;
    }

    sounds[index] = {
      ...sounds[index],
      ...updated,
    };

    writeSounds(sounds);

    return sounds[index];
  });
}

// ======================================================
// STORAGE
// ======================================================

const defaultSettings = {
  baseColor: "#ffffff",
  stopHotkey: { key: "esc", shift: true },
};

function ensureStorage() {
  if (!fs.existsSync(soundsPath)) {
    fs.mkdirSync(soundsPath, {
      recursive: true,
    });
  }

  if (!fs.existsSync(jsonPath)) {
    fs.writeFileSync(jsonPath, "[]");
  }

  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, "[]");
  }
}

function readSounds() {
  if (!fs.existsSync(jsonPath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

function writeSounds(sounds) {
  fs.writeFileSync(jsonPath, JSON.stringify(sounds, null, 2));
}

function readSettings() {
  if (!fs.existsSync(settingsPath)) {
    return defaultSettings;
  }

  try {
    return {
      ...defaultSettings,
      ...JSON.parse(fs.readFileSync(settingsPath, "utf-8")),
    };
  } catch (err) {
    console.error("Failed reading settings:", err);

    return defaultSettings;
  }
}

function writeSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function getSoundPath(fileName) {
  return path.join(soundsPath, fileName);
}

// ======================================================
// SAVE SOUND
// ======================================================

function saveSoundFile({
  sourcePath = null,
  buffer = null,
  fileName,
  originalName = fileName,
  metadata = undefined,
  deleteSource = false,
}) {
  const uniqueFileName = makeUniqueFileName(fileName);

  const destination = getSoundPath(uniqueFileName);

  // ============================================
  // WRITE FILE
  // ============================================

  if (sourcePath) {
    fs.copyFileSync(sourcePath, destination);

    // Delete original if requested
    if (deleteSource) {
      try {
        fs.unlinkSync(sourcePath);
      } catch (err) {
        console.warn("Failed to delete original file:", sourcePath, err);
      }
    }
  } else if (buffer) {
    fs.writeFileSync(destination, Buffer.from(buffer));
  } else {
    throw new Error("saveSoundFile requires sourcePath or buffer");
  }

  // ============================================
  // CREATE SOUND
  // ============================================

  const sound = {
    id: Date.now(),
    name: originalName,
    fileName: uniqueFileName,
    originalName,
    ...metadata,
  };

  const sounds = readSounds();

  sounds.push(sound);

  writeSounds(sounds);

  return sound;
}

function downloadYoutube(url, outputTemplate) {
  const ytDlpPath = getYtDlpPath();

  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, [
      "-f",
      "bestaudio",
      "-o",
      outputTemplate,
      "--newline",
      "--progress",
      "--progress-template",
      "%(progress._percent_str)s",
      "--print",
      "after_move:filepath",
      url,
    ]);

    let finalPath = "";

    proc.stdout.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      for (const line of lines) {
        if (line.endsWith("%")) {
          // This is a progress update
          const percent = parseFloat(line.replace("%", ""));
          if (!Number.isNaN(percent)) {
            mainWindow.webContents.send("youtube-download-progress", percent);
          }
        } else {
          // This is the actual final path
          finalPath = line;
        }
      }
    });

    proc.stderr.on("data", (data) => {
      // Optional: log warnings
      console.warn(data.toString());
    });

    proc.on("close", async (code) => {
      if (code !== 0) return reject(new Error("yt-dlp failed"));

      mainWindow.webContents.send("youtube-download-progress", 100);

      if (!finalPath || !fs.existsSync(finalPath)) {
        return reject(new Error("Final file not found"));
      }

      await new Promise((r) => setTimeout(r, 1000));

      resolve(finalPath);
    });
  });
}

function getYoutubeMetadata(url) {
  const ytDlpPath = getYtDlpPath();

  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, [
      "--no-download",
      "--print",
      "%(duration)s",
      "--print",
      "%(title)s",
      url,
    ]);

    let output = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error("yt-dlp metadata failed"));

      const [durationStr, title] = output
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      resolve({
        duration: Number(durationStr),
        title,
      });
    });
  });
}

// ======================================================
// HELPERS
// ======================================================

function makeUniqueFileName(fileName) {
  const ext = path.extname(fileName);

  const baseName = path.basename(fileName, ext);

  const uniqueId = makeId(4);

  return `${baseName}-${uniqueId}${ext}`;
}

function makeId(length = 4) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
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

function registerHotkey(hotkey, soundId) {
  if (!isValidHotkey(hotkey)) {
    console.warn("Skipping invalid hotkey", soundId, hotkey);

    return false;
  }

  const key = serializeHotkey(hotkey);

  if (!key) {
    console.warn("Failed to serialize hotkey", hotkey);

    return false;
  }

  try {
    if (globalShortcut.isRegistered(key)) {
      globalShortcut.unregister(key);
    }

    const success = globalShortcut.register(key, () => {
      mainWindow.webContents.send("play-sound", soundId);
    });

    return success;
  } catch (err) {
    console.error("Failed to register hotkey:", key, err);

    return false;
  }
}

function getYtDlpPath() {
  const base = path.join(app.getAppPath(), "resources", "yt-dlp");

  switch (os.platform()) {
    case "win32":
      return path.join(base, "win", "yt-dlp.exe");

    case "darwin":
      return path.join(base, "mac", "yt-dlp");

    case "linux":
      return path.join(base, "linux", "yt-dlp");

    default:
      throw new Error("Unsupported platform");
  }
}
