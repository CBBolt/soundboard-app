import { clampVolume } from "../lib/helpers";

const api = window.electronAPI;

class AudioEngine {
  private active = new Set<HTMLAudioElement>();
  private deviceId = "";

  constructor() {
    this.play = this.play.bind(this);
    this.stopAll = this.stopAll.bind(this);
    this.setDevice = this.setDevice.bind(this);
  }

  setDevice(id: string) {
    this.deviceId = id;
    this.rebindAll();
  }

  async playBlob(
    blob: Blob,
    options?: {
      duration?: number;
      gain?: number;
      startTime?: number;
      endTime?: number;
      fadeIn?: number;
      fadeOut?: number;
    },
  ) {
    const url = URL.createObjectURL(blob);

    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;

    this.active.add(audio);

    const controller = new AbortController();
    let cleaned = false;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;

      controller.abort();

      this.active.delete(audio);

      audio.pause();
      audio.removeAttribute("src");

      URL.revokeObjectURL(url);
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;

    if (this.deviceId && "setSinkId" in audio) {
      await this.safeSetSink(audio, this.deviceId);
    }

    audio.currentTime = options?.startTime ?? 0;

    const gain = options?.gain ?? 1;
    const fadeIn = options?.fadeIn ?? 0;

    audio.volume = fadeIn > 0 ? 0 : gain;

    await audio.play();

    if (fadeIn > 0) {
      this.fadeAudio(audio, {
        from: 0,
        to: gain,
        duration: fadeIn * 1000,
        signal: controller.signal,
      });
    }

    this.schedulePlayback(
      audio,
      {
        duration: options?.duration,
        startTime: options?.startTime,
        endTime: options?.endTime,
        fadeOut: options?.fadeOut,
      },
      controller,
      cleanup,
    );

    return audio;
  }

  async play(sound: Sound) {
    const filePath = await api.getSoundPath(sound.fileName);
    const buffer = await api.readSound(filePath);

    const ext = sound.fileName.split(".").pop()?.toLowerCase();

    const mime =
      ext === "mp3"
        ? "audio/mpeg"
        : ext === "wav"
          ? "audio/wav"
          : ext === "ogg"
            ? "audio/ogg"
            : ext === "webm"
              ? "audio/webm"
              : "application/octet-stream";

    const blob = new Blob([buffer as BlobPart], {
      type: mime,
    });

    return this.playBlob(blob, {
      duration: sound.duration,
      gain: sound.gain,
      startTime: sound.startTime,
      endTime: sound.endTime,
      fadeIn: sound.fadeIn,
      fadeOut: sound.fadeOut,
    });
  }

  stopAll() {
    for (const audio of this.active) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    }

    this.active.clear();
  }

  private async rebindAll() {
    for (const audio of this.active) {
      try {
        if ("setSinkId" in audio) {
          await audio.setSinkId(this.deviceId);
        }
      } catch {}
    }
  }

  private schedulePlayback(
    audio: HTMLAudioElement,
    options: {
      duration?: number;
      startTime?: number;
      endTime?: number;
      fadeOut?: number;
    },
    controller: AbortController,
    cleanup: () => void,
  ) {
    const duration = options.duration;

    if (!duration) {
      return;
    }

    const startTime = options.startTime ?? 0;

    const endTime = options.endTime ?? duration;

    const playbackDuration = Math.max(0, endTime - startTime);

    const fadeOut = options.fadeOut ?? 0;

    // No fade, just stop at the end
    if (fadeOut <= 0) {
      window.setTimeout(cleanup, playbackDuration * 1000);
      return;
    }

    const fadeStart = Math.max(0, playbackDuration - fadeOut) * 1000;

    window.setTimeout(() => {
      this.fadeAudio(audio, {
        from: audio.volume,
        to: 0,
        duration: fadeOut * 1000,
        signal: controller.signal,
      }).then(cleanup);
    }, fadeStart);

    // Safety stop in case fade timing is interrupted
    window.setTimeout(cleanup, playbackDuration * 1000 + 100);
  }

  private fadeAudio(
    audio: HTMLAudioElement,
    {
      from,
      to,
      duration,
      signal,
    }: {
      from: number;
      to: number;
      duration: number;
      signal?: AbortSignal;
    },
  ) {
    const start = performance.now();

    return new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (signal?.aborted) return resolve();

        const t = Math.min(1, (now - start) / duration);
        const value = from + (to - from) * t;

        audio.volume = clampVolume(value);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  }

  private async safeSetSink(audio: HTMLAudioElement, deviceId: string) {
    for (let i = 0; i < 3; i++) {
      try {
        await audio.setSinkId(deviceId);
        return;
      } catch (err) {
        if (i === 2) throw err;

        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }
}

export const audioEngine = new AudioEngine();
