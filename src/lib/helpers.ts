export const clampVolume = (v: number) => Math.max(0, Math.min(1, v));

export function getContrastTextColor(color: string) {
  const hex = color.replace("#", "");

  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;

  const r = parseInt(normalized.substring(0, 2), 16);

  const g = parseInt(normalized.substring(2, 4), 16);

  const b = parseInt(normalized.substring(4, 6), 16);

  // Perceived brightness formula

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? "black" : "white";
}

export const getAudioDuration = (file: Blob | File) =>
  new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);

    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load audio metadata"));
    };
  });
