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

  async play(sound: Sound) {
    const filePath = await api.getSoundPath(sound.fileName);
    const buffer = await api.readSound(filePath);

    const blob = new Blob([buffer as BlobPart], { type: "audio/*" });
    const url = URL.createObjectURL(blob);

    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;

    this.active.add(audio);

    let cleaned = false;
    const controller = new AbortController();

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;

      controller.abort(); // 🚨 kills fades instantly

      this.active.delete(audio);

      audio.pause();
      audio.src = "";
      audio.load();

      URL.revokeObjectURL(url);
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;

    try {
      // -----------------------------------
      // Wait for metadata (not canplaythrough)
      // -----------------------------------
      await new Promise<void>((res, rej) => {
        audio.onloadedmetadata = () => res();
        audio.onerror = rej;
      });

      // -----------------------------------
      // Device routing
      // -----------------------------------
      if (this.deviceId && "setSinkId" in audio) {
        await this.safeSetSink(audio, this.deviceId);
      }

      // -----------------------------------
      // Seek
      // -----------------------------------
      audio.currentTime = sound.startTime ?? 0;

      const gain = sound.gain ?? 1;
      const fadeIn = sound.fadeIn ?? 0;
      const fadeOut = sound.fadeOut ?? 0;

      const targetVolume = gain;

      // -----------------------------------
      // Start playback immediately
      // -----------------------------------
      const playPromise = audio.play();
      if (playPromise) await playPromise;

      // -----------------------------------
      // Fade IN (non-blocking)
      // -----------------------------------
      if (fadeIn > 0) {
        audio.volume = 0;

        this.fadeAudio(audio, {
          from: 0,
          to: targetVolume,
          duration: fadeIn * 1000,
          signal: controller.signal,
        });
      } else {
        audio.volume = targetVolume;
      }

      // -----------------------------------
      // Fade OUT (timed, async)
      // -----------------------------------
      const duration =
        (sound.endTime ?? audio.duration) - (sound.startTime ?? 0);

      if (fadeOut > 0) {
        const fadeStart = Math.max(0, duration - fadeOut) * 1000;

        setTimeout(() => {
          this.fadeAudio(audio, {
            from: audio.volume,
            to: 0,
            duration: fadeOut * 1000,
            signal: controller.signal,
          }).then(() => {
            audio.pause();
            cleanup();
          });
        }, fadeStart);
      }

      // -----------------------------------
      // Safety cleanup fallback
      // -----------------------------------
      setTimeout(() => {
        cleanup();
      }, duration * 1000);

      return audio;
    } catch (err) {
      cleanup();
      throw err;
    }
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
