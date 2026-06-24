import { ipcMain } from "electron";
import { pathToFileURL } from "url";
import { readFileSync } from "fs";
import path from "path";

import {
  readSounds,
  getSoundPath,
  updateSound,
  deleteSound,
  saveSoundFile,
} from "../storage/sounds.js";

import { getYoutubeMetadata, downloadYoutube } from "../helpers/youtube.js";

export function registerSoundHandlers(
  mainWindow,
  soundsFolderPath,
  soundsPath,
) {
  // GET Methods
  ipcMain.handle("get-sounds", async () => {
    return readSounds(soundsPath);
  });

  ipcMain.handle("get-sound-path", (_, fileName) => {
    return getSoundPath(soundsFolderPath, fileName);
  });

  ipcMain.handle("get-file-url", (_, filePath) => {
    return pathToFileURL(filePath).href;
  });

  ipcMain.handle("read-sound", (_, filePath) => {
    return readFileSync(filePath);
  });

  ipcMain.handle("save-sound", async (_, filePath, metadata) => {
    saveSoundFile(soundsFolderPath, soundsPath, {
      sourcePath: filePath,
      fileName: path.basename(filePath),
      originalName: path.basename(filePath),
      metadata,
    });
  });

  ipcMain.handle("save-recording", async (_, buffer, metadata) => {
    const extension = metadata.mimeType?.includes("webm")
      ? ".webm"
      : metadata.mimeType?.includes("wav")
        ? ".wav"
        : ".bin";

    saveSoundFile(soundsFolderPath, soundsPath, {
      buffer,
      fileName: `recording-${Date.now()}${extension}`,
      metadata,
    });
  });

  ipcMain.handle("add-youtube-audio", async (_, url) => {
    const outputTemplate = path.join(soundsFolderPath, "%(id)s.%(ext)s");

    let meta;

    try {
      meta = await getYoutubeMetadata(url);
    } catch (err) {
      console.error(err);

      throw new Error(
        err instanceof Error
          ? err.message
          : "Unable to retrieve media metadata",
      );

      return null;
    }

    const filePath = await downloadYoutube(mainWindow, url, outputTemplate);

    const sound = saveSoundFile(soundsFolderPath, soundsPath, {
      sourcePath: filePath,
      fileName: path.basename(filePath),
      originalName: meta.title,
      deleteSource: true,
      metadata: {
        duration: meta.duration,
        url,
      },
    });

    return sound;
  });

  ipcMain.handle("update-sound", (_, updated) => {
    updateSound(soundsPath, updated);
  });

  ipcMain.handle("delete-sound", (_, id) => {
    deleteSound(soundsFolderPath, soundsPath, id);
  });
}
