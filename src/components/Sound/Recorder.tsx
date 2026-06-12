import { useEffect, useRef, useState } from "react";

import SquareIcon from "../../icons/SquareIcon";
import CircleIcon from "../../icons/CircleIcon";
import TriangeIcon from "../../icons/TriangleIcon";
import SaveIcon from "../../icons/SaveIcon";
import RefreshIcon from "../../icons/RefreshIcon";
import MicIcon from "../../icons/MicIcon";

type RecorderProps = {
  devices: AudioDevice[];
  defaultInputDevice: string;
  onSave: (blob: Blob, duration: number, mimeType: string) => void;
  loadDevices: () => void;
};

type RecorderConfig = {
  recording: boolean;
  playing: boolean;
  devices: AudioDevice[];
  selectedDevice: string;
  recordedBlob: Blob | null;
  recordedDuration: number;
  recordedMimeType: string;
};

export default function Recorder({
  defaultInputDevice,
  devices,

  loadDevices,
  onSave,
}: RecorderProps) {
  const [config, setConfig] = useState<RecorderConfig>({
    recording: false,
    playing: false,
    devices,
    selectedDevice: defaultInputDevice,
    recordedBlob: null,
    recordedDuration: 0,
    recordedMimeType: "",
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const waveformRef = useRef<number[]>([]);

  const MAX_POINTS = 300;
  const VISUAL_GAIN = 5;

  // --------------------------------------------------
  // Waveform Drawing
  // --------------------------------------------------

  const draw = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;

    if (!analyser || !canvas) return;

    animationRef.current = requestAnimationFrame(draw);

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.fftSize);

    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;

      sum += v * v;
    }

    const volume = Math.sqrt(sum / dataArray.length);

    waveformRef.current.push(volume);

    if (waveformRef.current.length > MAX_POINTS) {
      waveformRef.current.shift();
    }

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#111";

    ctx.fillRect(0, 0, w, h);

    const barWidth = w / MAX_POINTS;

    waveformRef.current.forEach((v, i) => {
      const barHeight = Math.min(v * VISUAL_GAIN, 1) * h;

      ctx.fillStyle = "#00ff99";

      ctx.fillRect(
        i * barWidth,
        (h - barHeight) / 2,
        Math.max(barWidth - 1, 1),
        barHeight,
      );
    });
  };

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  const cleanup = async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);

      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());

    streamRef.current = null;

    analyserRef.current = null;

    if (audioCtxRef.current) {
      await audioCtxRef.current.close();

      audioCtxRef.current = null;
    }
  };

  // --------------------------------------------------
  // Start Recording
  // --------------------------------------------------

  const startRecording = async () => {
    try {
      waveformRef.current = [];
      chunksRef.current = [];

      setConfig((prev) => ({
        ...prev,
        recordedBlob: null,
      }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: config.selectedDevice
          ? {
              deviceId: {
                exact: config.selectedDevice,
              },

              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : true,
      });

      streamRef.current = stream;

      // Visualization

      const audioCtx = new AudioContext();

      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      const analyser = audioCtx.createAnalyser();

      analyser.fftSize = 2048;

      source.connect(analyser);

      analyserRef.current = analyser;

      draw();

      // Recording

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });

        const startedAt = recordingStartedAtRef.current;

        const duration =
          startedAt != null ? (performance.now() - startedAt) / 1000 : 0;

        setConfig((prev) => ({
          ...prev,
          recordedBlob: blob,
          recordedDuration: duration,
          recordedMimeType: mimeType,
        }));

        recordingStartedAtRef.current = null;

        await cleanup();
      };

      recordingStartedAtRef.current = performance.now();

      recorder.start(250);

      setConfig((prev) => ({
        ...prev,
        recording: true,
      }));
    } catch (err) {
      console.error("Recording failed:", err);

      await cleanup();
    }
  };

  // --------------------------------------------------
  // Stop Recording
  // --------------------------------------------------

  const stopRecording = async () => {
    setConfig((prev) => ({
      ...prev,
      recording: false,
    }));

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      await cleanup();
    }
  };

  // --------------------------------------------------
  // Playback
  // --------------------------------------------------

  const playRecording = async () => {
    if (!config.recordedBlob) return;

    stopPlayback();

    const url = URL.createObjectURL(config.recordedBlob);

    const audio = new Audio(url);

    playbackRef.current = audio;

    audio.onended = () => {
      setConfig((prev) => ({
        ...prev,
        playing: false,
      }));

      URL.revokeObjectURL(url);

      playbackRef.current = null;
    };

    await audio.play();

    setConfig((prev) => ({
      ...prev,
      playing: true,
    }));
  };

  const stopPlayback = () => {
    const audio = playbackRef.current;

    if (!audio) return;

    audio.pause();

    audio.currentTime = 0;

    playbackRef.current = null;

    setConfig((prev) => ({
      ...prev,
      playing: false,
    }));
  };

  // --------------------------------------------------
  // Save
  // --------------------------------------------------

  const saveRecording = () => {
    if (!config.recordedBlob) return;

    onSave(
      config.recordedBlob,
      config.recordedDuration,
      config.recordedMimeType,
    );
  };

  // --------------------------------------------------
  // Unmount Cleanup
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      cleanup();

      stopPlayback();
    };
  }, []);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div>
      <div className="flex-gap">
        <button onClick={loadDevices}>
          <div className="flex-gap">
            <RefreshIcon className="icon stroke" />
          </div>
        </button>

        <MicIcon className="icon fill" />

        <select
          value={config.selectedDevice}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              selectedDevice: e.target.value,
            }))
          }
        >
          <option value="">Default microphone</option>

          {config.devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label || `Microphone ${d.id.slice(0, 5)}`}
            </option>
          ))}
        </select>

        {/* Record */}

        <div
          className="icon-btn"
          onClick={() =>
            !config.recording ? startRecording() : stopRecording()
          }
        >
          {!config.recording ? (
            <div className="flex-gap">
              <CircleIcon className="icon fill" />
              Record
            </div>
          ) : (
            <div className="flex-gap">
              <SquareIcon className="icon fill" />
              Stop
            </div>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        style={{
          width: "100%",
          background: "#111",
          marginTop: 12,
        }}
      />

      {config.recordedBlob && (
        <div className="flex-gap">
          <>
            <button
              onClick={() =>
                !config.playing ? playRecording() : stopPlayback()
              }
            >
              {config.playing ? (
                <div className="flex-gap">
                  <SquareIcon className="icon fill" />
                  Stop
                </div>
              ) : (
                <div className="flex-gap">
                  <TriangeIcon className="icon fill " />
                  Play
                </div>
              )}
            </button>

            <button onClick={saveRecording}>
              <div className="flex-gap">
                <SaveIcon className="icon fill" />
                Save Recording
              </div>
            </button>
          </>
        </div>
      )}
    </div>
  );
}
