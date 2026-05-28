import { useEffect, useRef, useState } from "react";
import TriangeIcon from "../../icons/TriangleIcon";
import SquareIcon from "../../icons/SquareIcon";
import { WaveformEditor } from "../../lib/waveformEditor";

import styles from "../../styles/SoundClipEditor.module.css";
import VolumeSlider from "../VolumeSlider";
import QuestionIcon from "../../icons/QuestionIcon";
import Modal from "../Modal/Modal";

type Props = {
  show: boolean;
  blob: Blob;
  sound: Sound;
  playSound: (sound: Sound, options: Partial<Sound>) => void;
  stopSound: () => void;
  onChange: (data: Partial<Sound>) => void;
};

export default function SoundClipEditor({
  show,
  blob,
  sound,
  playSound,
  stopSound,
  onChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const waveformRef = useRef<WaveformEditor | null>(null);

  // -----------------------------------
  // Unified editor state
  // -----------------------------------

  const [helper, setHelper] = useState(false);

  const [settings, setSettings] = useState({
    startTime: sound.startTime ?? 0,
    endTime: sound.endTime ?? 0,
    gain: sound.gain ?? 1,
    fadeIn: sound.fadeIn ?? 0,
    fadeOut: sound.fadeOut ?? 0,
  });

  const getDuration = () => audioBufferRef.current?.duration ?? 0;

  // shorthand
  const { startTime, endTime, gain } = settings;

  useEffect(() => {
    if (!canvasRef.current || !audioBufferRef.current) return;

    const drawer = new WaveformEditor({
      canvas: canvasRef.current,
      audioBuffer: audioBufferRef.current!,
      settings,
      onChange: (data) => {
        setSettings({ ...data });
      },
    });

    drawer.draw();

    waveformRef.current = drawer;

    return () => {
      drawer.destroy();
      waveformRef.current = null;
    };
  }, [audioBufferRef.current]);

  useEffect(() => {
    onChange({ ...settings });
  }, [settings]);

  // -----------------------------------
  // Decode ONCE
  // -----------------------------------

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      // reuse single context
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }

      const ctx = audioCtxRef.current;

      const arrayBuffer = await blob.arrayBuffer();

      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));

      if (!mounted) return;

      audioBufferRef.current = decoded;

      // initialize end time once
      setSettings((prev) => ({
        ...prev,
        endTime: prev.endTime || decoded.duration,
      }));
    };

    load();

    return () => {
      mounted = false;
    };
  }, [blob]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      waveformRef.current?.draw();
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  // -----------------------------------
  // Redraw waveform
  // -----------------------------------

  useEffect(() => {
    const buffer = audioBufferRef.current;
    if (!buffer) return;

    requestAnimationFrame(() => {
      waveformRef.current?.setSettings(settings);
      waveformRef.current?.draw();
    });
  }, [settings]);

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <div className={`wrapper ${styles.editor} ${show ? styles.show : ""}`}>
      <Modal isOpen={helper} onClose={() => setHelper(false)}>
        <div
          className="flex-gap"
          style={{ position: "absolute", top: 20, left: 10 }}
        >
          <QuestionIcon className="icon fill" />
          <h2>Sound Editor</h2>
        </div>
        <div
          style={{
            background: "#222",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          <div className="flex-gap">
            <div
              style={{
                backgroundColor: "#00ff99",
                height: "20px",
                width: "20px",
                borderRadius: "100%",
              }}
            />
            Start Time
          </div>
          <div className="flex-gap">
            <div
              style={{
                backgroundColor: "#ff3366",
                height: "20px",
                width: "20px",
                borderRadius: "100%",
              }}
            />
            End Time
          </div>
          <div className="flex-gap">
            <div
              style={{
                backgroundColor: "#0096ff",
                height: "20px",
                width: "20px",
                borderRadius: "100%",
              }}
            />
            Fade In
          </div>
          <div className="flex-gap">
            <div
              style={{
                backgroundColor: "#ffaa00",
                height: "20px",
                width: "20px",
                borderRadius: "100%",
              }}
            />
            Fade Out
          </div>

          <div className="seperator" />

          <div className="flex-gap">
            Volume:
            <VolumeSlider value={0.4} onChange={() => {}} showValue={false} />
          </div>
        </div>
      </Modal>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <span>TRIMMED: {(endTime - startTime).toFixed(2)}s</span>
            <span>TOTAL: {getDuration().toFixed(2)}s</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
            }}
          >
            <div className="icon-btn" onClick={() => setHelper(true)}>
              <QuestionIcon className="icon sml fill" />
            </div>
            <div
              className="icon-btn"
              onClick={() => playSound(sound, settings)}
            >
              <TriangeIcon className="icon sml fill" />
            </div>

            <div className="icon-btn" onClick={stopSound}>
              <SquareIcon className="icon sml fill" />
            </div>
          </div>
        </div>
      </div>
      <div className="seperator" />
      <div
        className="flex-gap"
        style={{
          alignItems: "stretch",
          width: "100%",
          overflowX: "auto",
          overflowY: "visible",
        }}
      >
        <canvas
          ref={canvasRef}
          width={300}
          height={20}
          style={{
            flex: 1,
            background: "#111",
            touchAction: "none",
            borderRadius: 8,
          }}
        />

        <VolumeSlider
          value={gain}
          orientation="vertical"
          height={140}
          onChange={(val) =>
            setSettings((p) => ({
              ...p,
              gain: val,
            }))
          }
        />
      </div>
    </div>
  );
}
