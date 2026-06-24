type DragTarget = "start" | "end" | "fadeIn" | "fadeOut" | "pan" | null;

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

  private rafPending = false;

  private HIT = 8;
  private HANDLESIZE = 6;

  private viewStart = 0;
  private viewEnd = 0;

  private lastPanX = 0;

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

    const duration = options.audioBuffer.duration;

    this.viewStart = 0;
    this.viewEnd = Math.min(options.settings.endTime * 1.1, duration);

    this.onChange = options.onChange;

    this.bindEvents();
    this.requestDraw();
  }

  // -----------------------------------
  // Public API
  // -----------------------------------

  public zoom(factor: number, centerTime?: number) {
    const duration = this.audioBuffer.duration;

    centerTime ??= (this.viewStart + this.viewEnd) * 0.5;

    const currentRange = this.viewEnd - this.viewStart;

    const newRange = Math.max(0.05, Math.min(duration, currentRange / factor));

    let start = centerTime - newRange * 0.5;
    let end = centerTime + newRange * 0.5;

    if (start < 0) {
      end -= start;
      start = 0;
    }

    if (end > duration) {
      start -= end - duration;
      end = duration;
    }

    this.viewStart = Math.max(0, start);
    this.viewEnd = Math.min(duration, end);

    this.requestDraw();
  }

  public setSettings(settings: Partial<WaveformSettings>) {
    this.settings = {
      ...this.settings,
      ...settings,
    };

    this.requestDraw();
  }

  public setAudioBuffer(buffer: AudioBuffer) {
    this.audioBuffer = buffer;
    this.requestDraw();
  }

  public destroy() {
    this.unbindEvents();
  }

  // -----------------------------------
  // Event Binding
  // -----------------------------------

  private bindEvents() {
    this.canvas.addEventListener("wheel", this.handleWheel);

    this.canvas.addEventListener("pointerdown", this.handlePointerDown);

    this.canvas.addEventListener("pointermove", this.handlePointerMove);

    this.canvas.addEventListener("pointerup", this.handlePointerUp);

    this.canvas.addEventListener("pointerleave", this.handlePointerUp);
  }

  private unbindEvents() {
    this.canvas.removeEventListener("wheel", this.handleWheel);

    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);

    this.canvas.removeEventListener("pointermove", this.handlePointerMove);

    this.canvas.removeEventListener("pointerup", this.handlePointerUp);

    this.canvas.removeEventListener("pointerleave", this.handlePointerUp);
  }

  // -----------------------------------
  // Helpers
  // -----------------------------------

  private isVisibleX(x: number) {
    return x >= -this.HANDLESIZE && x <= this.canvas.width + this.HANDLESIZE;
  }

  private requestDraw() {
    if (this.rafPending) return;

    this.rafPending = true;

    requestAnimationFrame(() => {
      this.rafPending = false;
      this.draw();
    });
  }

  private getWidth() {
    return this.canvas.width;
  }

  private clampX(x: number) {
    return Math.max(0, Math.min(this.getWidth(), x));
  }

  private timeToX(time: number) {
    const range = this.viewEnd - this.viewStart;

    return ((time - this.viewStart) / range) * this.getWidth();
  }

  private xToTime(x: number) {
    const range = this.viewEnd - this.viewStart;

    return this.viewStart + (x / this.getWidth()) * range;
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

    const startX = this.timeToX(startTime);
    const endX = this.timeToX(endTime);

    const fadeInX = this.timeToX(Math.min(startTime + fadeIn, endTime));

    const fadeOutX = this.timeToX(Math.max(endTime - fadeOut, startTime));

    if (this.hitHandle(fadeInX, this.canvas.height * 0.25, x, y)) {
      this.drag = "fadeIn";
    } else if (this.hitHandle(fadeOutX, this.canvas.height * 0.75, x, y)) {
      this.drag = "fadeOut";
    } else if (Math.abs(x - startX) < this.HIT) {
      this.drag = "start";
    } else if (Math.abs(x - endX) < this.HIT) {
      this.drag = "end";
    } else {
      this.drag = "pan";

      this.lastPanX = x;
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    const [x, y] = this.getCanvasXY(e);

    const { startTime, endTime, fadeIn, fadeOut } = this.settings;

    const startX = this.timeToX(startTime);
    const endX = this.timeToX(endTime);

    const fadeInX = this.timeToX(Math.min(startTime + fadeIn, endTime));

    const fadeOutX = this.timeToX(Math.max(endTime - fadeOut, startTime));

    // dragging
    if (this.isDragging && this.drag) {
      if (this.pointerId !== e.pointerId) return;

      const time = this.xToTime(x);
      const visibleRange = this.viewEnd - this.viewStart;

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
            this.settings.startTime + this.HANDLESIZE * 0.05,
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
        case "pan": {
          const dx = x - this.lastPanX;
          this.lastPanX = x;

          const deltaTime = dx * (visibleRange / this.canvas.width);

          const duration = this.audioBuffer.duration;

          let start = this.viewStart - deltaTime;
          let end = this.viewEnd - deltaTime;

          if (start < 0) {
            end -= start;
            start = 0;
          }

          if (end > duration) {
            start -= end - duration;
            end = duration;
          }

          this.viewStart = start;
          this.viewEnd = end;

          break;
        }
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

    if (this.isDragging && this.drag === "pan") {
      this.canvas.style.cursor = "grabbing";
    } else if (this.hover) {
      this.canvas.style.cursor = "pointer";
    } else {
      this.canvas.style.cursor = "grab";
    }

    this.requestDraw();
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }

    this.isDragging = false;
    this.drag = null;
    this.pointerId = null;

    this.canvas.style.cursor = this.hover ? "pointer" : "grab";
  };

  // -----------------------------------
  // Mouse Wheel
  // -----------------------------------

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * this.canvas.width;

    const centerTime = this.xToTime(x);

    const factor = e.deltaY < 0 ? 1.25 : 0.8;

    this.zoom(factor, centerTime);
  };

  // -----------------------------------
  // Drawing
  // -----------------------------------

  private drawHandle(x: number, y: number, color: string) {
    const size = this.HANDLESIZE;

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

    const sampleRate = buffer.sampleRate;

    const startSample = Math.floor(this.viewStart * sampleRate);
    const endSample = Math.floor(this.viewEnd * sampleRate);

    const visibleSamples = endSample - startSample;

    // background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    // waveform
    ctx.strokeStyle = "#00ff99";
    ctx.lineWidth = 1;
    ctx.beginPath();

    const samplesPerPixel = visibleSamples / width;

    for (let x = 0; x < width; x++) {
      const start = Math.floor(startSample + x * samplesPerPixel);

      const end = Math.min(data.length, Math.floor(start + samplesPerPixel));

      let peak = 0;

      for (let i = start; i < end; i++) {
        peak = Math.max(peak, Math.abs(data[i] * gain));
      }

      const y1 = height / 2 - peak * height * 0.45;
      const y2 = height / 2 + peak * height * 0.45;

      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }

    ctx.stroke();

    // selection
    const startX = this.timeToX(startTime);

    const endX = this.timeToX(endTime);

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
    const fadeInX = this.timeToX(Math.min(startTime + fadeIn, endTime));

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
    const fadeOutX = this.timeToX(Math.max(endTime - fadeOut, startTime));

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
    if (this.isVisibleX(startX)) {
      this.drawHandle(
        startX,
        centerY,
        this.hover === "start" ? "#7CFFB2" : "#00ff99",
      );
    }

    if (this.isVisibleX(endX)) {
      this.drawHandle(
        endX,
        centerY,
        this.hover === "end" ? "#ff6b8a" : "#ff3366",
      );
    }

    if (this.isVisibleX(fadeInX)) {
      this.drawHandle(
        fadeInX,
        height * 0.25,
        this.hover === "fadeIn" ? "#4dc3ff" : "#0096ff",
      );
    }

    if (this.isVisibleX(fadeOutX)) {
      this.drawHandle(
        fadeOutX,
        height * 0.75,
        this.hover === "fadeOut" ? "#ffd08a" : "#ffaa00",
      );
    }
  }
}
