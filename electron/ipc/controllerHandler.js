import { ipcMain, BrowserWindow } from "electron";

import path from "path";

let showController = false;
let controllerWindow;
let __dirname;
let curMainWindow;

export function registerControllerHandlers(mainWindow, dirname) {
  __dirname = dirname;
  curMainWindow = mainWindow;

  if (!controllerWindow) {
    createcontrollerWindow();
    controllerWindow.hide();
  }

  ipcMain.handle("show-controller", () => {
    if (controllerWindow) controllerWindow.show();

    mainWindow.webContents.send("toggle-controller", true);

    showController = true;
  });

  ipcMain.handle("hide-controller", () => {
    if (controllerWindow) controllerWindow.hide();

    mainWindow.webContents.send("toggle-controller", false);

    showController = false;
  });

  ipcMain.handle("send-sound", (_, id) => {
    mainWindow.webContents.send("play-sound", id);
  });

  ipcMain.handle("send-data", (_, data) => {
    if (controllerWindow)
      controllerWindow.webContents.send("main-recieved", data);
  });
}

export function toggleController() {
  if (!controllerWindow || !curMainWindow) return;

  showController = !showController;

  curMainWindow.webContents.send("toggle-controller", showController);

  if (showController) {
    controllerWindow.show();
  } else {
    controllerWindow.hide();
  }
}

function createcontrollerWindow() {
  controllerWindow = new BrowserWindow({
    modal: true,

    width: 600,
    height: 400,

    skipTaskbar: true,
    frame: false,
    transparent: true,

    // resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    controllerWindow.webContents.openDevTools();
    controllerWindow.loadURL(
      `${process.env.VITE_DEV_SERVER_URL}/controller.html`,
    );
  } else {
    controllerWindow.loadFile(
      path.join(app.getAppPath(), "dist/renderer/controller.html"),
    );
  }

  controllerWindow.on("closed", () => {
    controllerWindow = null;
  });
}
