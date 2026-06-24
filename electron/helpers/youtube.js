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

    proc.on("error", reject);

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

    let stderr = "";

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", async (code) => {
      if (code !== 0)
        return reject(new Error(`yt-dlp download failed (${code})\n${stderr}`));

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
      "--dump-single-json",
      "--no-download",
      "--no-warnings",
      url,
    ]);

    let output = "";
    let stderr = "";

    proc.stdout.on("data", (d) => {
      output += d.toString();
    });

    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    proc.on("error", reject);

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp metadata failed (${code})\n${stderr}`));
      }

      try {
        const json = JSON.parse(output);

        resolve({
          duration: json.duration,
          title: json.title,
        });
      } catch (err) {
        reject(new Error(`Failed to parse yt-dlp JSON\n\n${output}`));
      }
    });
  });
}

function getYtDlpPath() {
  const base = path.join(app.getAppPath(), "resources", "yt-dlp");

  let executable;

  switch (os.platform()) {
    case "win32":
      executable = path.join(base, "win", "yt-dlp.exe");
      break;

    case "darwin":
      executable = path.join(base, "mac", "yt-dlp");
      break;

    case "linux":
      executable = path.join(base, "linux", "yt-dlp");
      break;

    default:
      throw new Error("Unsupported platform");
  }

  if (!fs.existsSync(executable)) {
    throw new Error(`yt-dlp executable not found: ${executable}`);
  }

  return executable;
}
