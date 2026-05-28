const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Files
  pickAudioFile: () => ipcRenderer.invoke("pick-audio-file"),
  getFileUrl: (filePath) => ipcRenderer.invoke("get-file-url", filePath),

  // Sounds
  readSound: (fileName) => ipcRenderer.invoke("read-sound", fileName),
  getSounds: () => ipcRenderer.invoke("get-sounds"),
  getSoundPath: (fileName) => ipcRenderer.invoke("get-sound-path", fileName),
  saveSound: (filePath, metadata) =>
    ipcRenderer.invoke("save-sound", filePath, metadata),
  deleteSound: (id) => ipcRenderer.invoke("delete-sound", id),
  renameSound: (data) => ipcRenderer.invoke("rename-sound", data),
  updateSound: (updated) => ipcRenderer.invoke("update-sound", updated),
  saveRecording: (buffer, metadata) =>
    ipcRenderer.invoke("save-recording", buffer, metadata),

  onPlaySound: (callback) => {
    const handler = (_, soundId) => callback(soundId);

    ipcRenderer.on("play-sound", handler);

    return () => {
      ipcRenderer.removeListener("play-sound", handler);
    };
  },

  // Hotkeys
  registerHotkey: (hotkey, soundId) =>
    ipcRenderer.invoke("register-hotkey", hotkey, soundId),
  unregisterHotkeys: () => ipcRenderer.invoke("unregister-hotkeys"),

  // VB Audio

  detectVBAudio: () => ipcRenderer.invoke("detect-vb-audio"),
  disableVBAudio: () => ipcRenderer.invoke("disable-vb-audio"),

  // Settings
  readSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (data) => ipcRenderer.invoke("update-settings", data),
});
