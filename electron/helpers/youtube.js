import { app } from "electron";

import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export function downloadYoutube(mainWindow, url, outputTemplate) {
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

export function getYoutubeMetadata(url) {
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
