import path from "path";
import fs from "fs";

import { readData, writeData } from "../helpers/data.js";

export function readSounds(soundsPath) {
  return readData(soundsPath, []);
}

export function updateSound(soundsPath, updated) {
  const sounds = readSounds(soundsPath);

  const index = sounds.findIndex((s) => s.id === updated.id);

  if (index === -1) {
    return null;
  }

  sounds[index] = {
    ...sounds[index],
    ...updated,
  };

  writeData(soundsPath, sounds);
}

export function deleteSound(soundsFolderPath, soundsPath, id) {
  const sounds = readSounds(soundsPath);

  const sound = sounds.find((s) => s.id === id);

  if (!sound) {
    return;
  }

  const filePath = getSoundPath(soundsFolderPath, sound.fileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const updated = sounds.filter((s) => s.id !== id);

  writeData(soundsPath, updated);
}

export function getSoundPath(soundsFolderPath, fileName) {
  return path.join(soundsFolderPath, fileName);
}

export function saveSoundFile(
  soundsFolderPath,
  soundsPath,
  {
    sourcePath = null,
    buffer = null,
    fileName,
    originalName = fileName,
    metadata = undefined,
    deleteSource = false,
  },
) {
  const uniqueFileName = makeUniqueFileName(fileName);

  const destination = getSoundPath(soundsFolderPath, uniqueFileName);

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

  const sounds = readSounds(soundsPath);

  sounds.push(sound);

  writeData(soundsPath, sounds);
}

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
