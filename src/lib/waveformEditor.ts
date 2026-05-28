type DragTarget = "start" | "end" | "fadeIn" | "fadeOut" | null;

export interface WaveformSettings {
  startTime: number;
  endTime: number;
  fadeIn: number;
  fadeOut: number;
  gain: number;
}

interface CanvasDrawerOptions {
  canvas: HTMLCanvasElement;
  audioBuffer: AudioBuffer;

  settings: WaveformSettings;

  onChange?: (settings: WaveformSettings) => void;
}

export class WaveformEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioBuffer: AudioBuffer;

  private settings: WaveformSettings;
  private onChange?: (settings: WaveformSettings) => void;

  private HIT = 8;

  private hover: DragTarget = null;
  private drag: DragTarget = null;

  private isDragging = false;
  private pointerId: number | null = null;

  constructor(options: CanvasDrawerOptions) {
    this.canvas = options.canvas;

    const ctx = this.canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    this.ctx = ctx;

    this.audioBuffer = options.audioBuffer;
    this.settings = options.settings;

    this.onChange = options.onChange;

    this.bindEvents();
    this.draw();
  }

  // -----------------------------------
  // Public API
  // -----------------------------------

  public setSettings(settings: Partial<WaveformSettings>) {
    this.settings = {
      ...this.settings,
      ...settings,
    };

    this.draw();
  }

  public setAudioBuffer(buffer: AudioBuffer) {
    this.audioBuffer = buffer;
    this.draw();
  }

  public destroy() {
    this.unbindEvents();
  }

  // -----------------------------------
  // Event Binding
  // -----------------------------------

  private bindEvents() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);

    this.canvas.addEventListener("pointermove", this.handlePointerMove);

    this.canvas.addEventListener("pointerup", this.handlePointerUp);

    this.canvas.addEventListener("pointerleave", this.handlePointerUp);
  }

  private unbindEvents() {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);

    this.canvas.removeEventListener("pointermove", this.handlePointerMove);

    this.canvas.removeEventListener("pointerup", this.handlePointerUp);

    this.canvas.removeEventListener("pointerleave", this.handlePointerUp);
  }

  // -----------------------------------
  // Helpers
  // -----------------------------------

  private getWidth() {
    return this.canvas.width;
  }

  private clampX(x: number) {
    return Math.max(0, Math.min(this.getWidth(), x));
  }

  private timeToX(time: number, duration: number) {
    return (time / duration) * this.getWidth();
  }

  private xToTime(x: number, duration: number) {
    return (x / this.getWidth()) * duration;
  }

  private getCanvasXY(e: PointerEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();

    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const x = this.clampX((e.clientX - rect.left) * scaleX);
    const y = (e.clientY - rect.top) * scaleY;

    return [x, y];
  }

  private hitHandle(hx: number, hy: number, x: number, y: number) {
    return Math.abs(x - hx) < this.HIT * 2 && Math.abs(y - hy) < this.HIT * 2;
  }

  private emitChange() {
    this.onChange?.(this.settings);
  }

  // -----------------------------------
  // Pointer Events
  // -----------------------------------

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();

    this.canvas.setPointerCapture(e.pointerId);

    this.pointerId = e.pointerId;
    this.isDragging = true;

    const [x, y] = this.getCanvasXY(e);

    const { startTime, endTime, fadeIn, fadeOut } = this.settings;

    const duration = this.audioBuffer.duration;

    const startX = this.timeToX(startTime, duration);
    const endX = this.timeToX(endTime, duration);

    const fadeInX = this.timeToX(
      Math.min(startTime + fadeIn, endTime),
      duration,
    );

    const fadeOutX = this.timeToX(
      Math.max(endTime - fadeOut, startTime),
      duration,
    );

    if (this.hitHandle(fadeInX, this.canvas.height * 0.25, x, y)) {
      this.drag = "fadeIn";
    } else if (this.hitHandle(fadeOutX, this.canvas.height * 0.75, x, y)) {
      this.drag = "fadeOut";
    } else if (Math.abs(x - startX) < this.HIT) {
      this.drag = "start";
    } else if (Math.abs(x - endX) < this.HIT) {
      this.drag = "end";
    } else {
      this.drag = null;
      this.isDragging = false;
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    const [x, y] = this.getCanvasXY(e);

    const duration = this.audioBuffer.duration;

    const { startTime, endTime, fadeIn, fadeOut } = this.settings;

    const startX = this.timeToX(startTime, duration);
    const endX = this.timeToX(endTime, duration);

    const fadeInX = this.timeToX(
      Math.min(startTime + fadeIn, endTime),
      duration,
    );

    const fadeOutX = this.timeToX(
      Math.max(endTime - fadeOut, startTime),
      duration,
    );

    // dragging
    if (this.isDragging && this.drag) {
      if (this.pointerId !== e.pointerId) return;

      const time = this.xToTime(x, duration);

      switch (this.drag) {
        case "start":
          this.settings.startTime = Math.min(
            time,
            this.settings.endTime - 0.01,
          );
          break;

        case "end":
          this.settings.endTime = Math.max(
            time,
            this.settings.startTime + 0.01,
          );
          break;

        case "fadeIn":
          this.settings.fadeIn = Math.max(
            0,
            Math.min(
              time - this.settings.startTime,
              this.settings.endTime - this.settings.startTime,
            ),
          );
          break;

        case "fadeOut":
          this.settings.fadeOut = Math.max(
            0,
            Math.min(
              this.settings.endTime - time,
              this.settings.endTime - this.settings.startTime,
            ),
          );
          break;
      }

      this.emitChange();
      this.draw();

      return;
    }

    // hover detection
    if (this.hitHandle(fadeInX, this.canvas.height * 0.25, x, y)) {
      this.hover = "fadeIn";
    } else if (this.hitHandle(fadeOutX, this.canvas.height * 0.75, x, y)) {
      this.hover = "fadeOut";
    } else if (Math.abs(x - startX) < this.HIT) {
      this.hover = "start";
    } else if (Math.abs(x - endX) < this.HIT) {
      this.hover = "end";
    } else {
      this.hover = null;
    }

    this.canvas.style.cursor = this.hover ? "pointer" : "default";

    this.draw();
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }

    this.isDragging = false;
    this.drag = null;
    this.pointerId = null;
  };

  // -----------------------------------
  // Drawing
  // -----------------------------------

  private drawHandle(x: number, y: number, color: string) {
    const size = 6;

    this.ctx.beginPath();

    this.ctx.arc(x, y, size, 0, Math.PI * 2);

    this.ctx.fillStyle = color;
    this.ctx.fill();

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "#000";
    this.ctx.stroke();
  }

  public draw() {
    const ctx = this.ctx;
    const buffer = this.audioBuffer;

    const width = this.canvas.width;
    const height = this.canvas.height;

    const { startTime, endTime, fadeIn, fadeOut, gain = 1 } = this.settings;

    const data = buffer.getChannelData(0);

    const step = Math.max(1, Math.floor(data.length / width));

    // background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    // waveform
    ctx.strokeStyle = "#00ff99";
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const sample = (data[i * step] || 0) * gain;

      const clamped = Math.max(-1, Math.min(1, sample));

      const y = ((1 - clamped) * height) / 2;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }

    ctx.stroke();

    // selection
    const startX = this.timeToX(startTime, buffer.duration);

    const endX = this.timeToX(endTime, buffer.duration);

    ctx.fillStyle = "rgba(0,255,153,0.15)";
    ctx.fillRect(startX, 0, endX - startX, height);

    // start line
    ctx.strokeStyle = "#00ff99";
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // end line
    ctx.strokeStyle = "#ff3366";
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // fade in region
    const fadeInX = this.timeToX(
      Math.min(startTime + fadeIn, endTime),
      buffer.duration,
    );

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(startX, height);
    ctx.lineTo(startX, 0);
    ctx.lineTo(fadeInX, height);
    ctx.closePath();

    ctx.fillStyle = "rgba(0,150,255,0.25)";
    ctx.fill();

    ctx.restore();

    // fade out region
    const fadeOutX = this.timeToX(
      Math.max(endTime - fadeOut, startTime),
      buffer.duration,
    );

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(fadeOutX, height);
    ctx.lineTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.closePath();

    ctx.fillStyle = "rgba(255,165,0,0.25)";
    ctx.fill();

    ctx.restore();

    const centerY = height / 2;

    // handles
    this.drawHandle(
      startX,
      centerY,
      this.hover === "start" ? "#7CFFB2" : "#00ff99",
    );

    this.drawHandle(
      endX,
      centerY,
      this.hover === "end" ? "#ff6b8a" : "#ff3366",
    );

    this.drawHandle(
      fadeInX,
      height * 0.25,
      this.hover === "fadeIn" ? "#4dc3ff" : "#0096ff",
    );

    this.drawHandle(
      fadeOutX,
      height * 0.75,
      this.hover === "fadeOut" ? "#ffd08a" : "#ffaa00",
    );
  }
}
