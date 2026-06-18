const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  //Controller
  showController: () => ipcRenderer.invoke("show-controller"),
  hideController: () => ipcRenderer.invoke("hide-controller"),
  sendSound: (id) => ipcRenderer.invoke("send-sound", id),
  sendData: (data) => ipcRenderer.invoke("send-data", data),
  onMainRecieved: (callback) => {
    const handler = (_, data) => callback(data);

    ipcRenderer.on("main-recieved", handler);

    return () => {
      ipcRenderer.removeListener("main-recieved", handler);
    };
  },

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
  updateSound: (updated) => ipcRenderer.invoke("update-sound", updated),
  saveRecording: (buffer, metadata) =>
    ipcRenderer.invoke("save-recording", buffer, metadata),
  saveYoutubeLink: (link) => ipcRenderer.invoke("add-youtube-audio", link),

  onYoutubeProgress: (callback) => {
    const handler = (_, soundId) => callback(soundId);

    ipcRenderer.on("youtube-download-progress", handler);

    return () => {
      ipcRenderer.removeListener("youtube-download-progress", handler);
    };
  },

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
  openVoicemeeter: () => ipcRenderer.invoke("open-voicemeeter"),
  setVMCommand: (command) => ipcRenderer.invoke("vm-command", command),

  // Settings
  readSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (data) => ipcRenderer.invoke("update-settings", data),

  // Boards
  getBoards: () => ipcRenderer.invoke("get-boards"),
  addBoard: (board) => ipcRenderer.invoke("add-board", board),
  updateBoard: (data) => ipcRenderer.invoke("update-board", data),
  deleteBoard: (id) => ipcRenderer.invoke("delete-board", id),

  //Tags
  getTags: () => ipcRenderer.invoke("get-tags"),
  addTag: (tag) => ipcRenderer.invoke("add-tag", tag),
  updateTag: (data) => ipcRenderer.invoke("update-tag", data),
  deleteTag: (id) => ipcRenderer.invoke("delete-tag", id),
});
