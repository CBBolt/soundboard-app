import { ipcMain } from "electron";

import { exec, execFile } from "child_process";

export function registerVoiceMeeterHandlers(bridge, queue) {
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
}
