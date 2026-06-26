import { useEffect, useState } from "react";

export const clampVolume = (v: number) => Math.max(0, Math.min(1, v));

export const truncateText = (s: string, c: number = 20) =>
  s.length > c ? s.slice(0, c) + "..." : s;

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

function getStableDeviceId(device: MediaDeviceInfo) {
  if (
    device.deviceId &&
    device.deviceId !== "default" &&
    device.deviceId !== "communications"
  ) {
    return device.deviceId;
  }

  return `${device.kind}:${device.label}`;
}

export function fuzzyMatchDevices(
  vmDevices: string[],
  mediaDevices: MediaDeviceInfo[],
) {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[()]/g, "").replace(/\s+/g, " ").trim();

  return vmDevices.map((vmLabel) => {
    const normalizedVm = normalize(vmLabel);

    let bestMatch = null;
    let bestScore = 0;

    for (const mediaDevice of mediaDevices) {
      const normalizedMedia = normalize(mediaDevice.label);

      let score = 0;

      if (normalizedMedia.includes(normalizedVm)) {
        score = normalizedVm.length;
      } else if (normalizedVm.includes(normalizedMedia)) {
        score = normalizedMedia.length;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = mediaDevice;
      }
    }

    return {
      label: vmLabel,
      id: bestMatch ? getStableDeviceId(bestMatch) : "ERROR",
    };
  });
}

export async function checkVM() {
  const vb = await window.electronAPI.detectVBAudio();

  const VBDetected = { vbCable: false, voicemeeter: false };

  for (const v of vb) {
    let name = v.FriendlyName.toLowerCase();
    if (name.includes("cable")) VBDetected.vbCable = true;
    if (name.includes("voicemeeter")) VBDetected.voicemeeter = true;
  }

  return VBDetected;
}

export async function getDevices() {
  const api = window.electronAPI;
  let vmInputs: AudioDevice[] = [];
  let vmOutputs: AudioDevice[] = [];

  const vb = await checkVM();

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const outputs = devices.filter((d) => d.kind === "audiooutput");

    if (vb.voicemeeter) {
      const vmOutputDevices = await api.setVMCommand({
        cmd: "output_devices",
      });

      if (!vmOutputDevices.success) {
        throw new Error("Failure getting VM Output Devices");
      }

      vmOutputs = fuzzyMatchDevices(
        vmOutputDevices.string_value!.split(", "),
        outputs,
      );
    } else {
      vmOutputs = outputs.map((o) => ({ id: o.deviceId, label: o.label }));
    }

    const inputs = devices.filter((d) => d.kind === "audioinput");

    if (vb.voicemeeter) {
      const vmInputDevices = await api.setVMCommand({
        cmd: "input_devices",
      });

      if (!vmInputDevices.success) {
        throw new Error("Failure getting VM Input Devices");
      }

      vmInputs = fuzzyMatchDevices(
        vmInputDevices.string_value!.split(", "),
        inputs,
      );
    } else {
      vmInputs = inputs.map((o) => ({ id: o.deviceId, label: o.label }));
    }
  } catch (err) {
    console.error("Failed loading devices", err);
  }

  return {
    inputs: vmInputs.sort((a, b) => a.label.localeCompare(b.label)),
    outputs: vmOutputs.sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export const getVMConfig = async () => {
  const api = window.electronAPI;

  const vb = await checkVM();
  if (!vb.voicemeeter) return;

  const inputA = await api.setVMCommand({
    cmd: "get_float",
    param: "Strip[1].A1",
  });
  const inputGain = await api.setVMCommand({
    cmd: "get_float",
    param: "Strip[1].Gain",
  });
  const inputMute = await api.setVMCommand({
    cmd: "get_float",
    param: "Strip[1].Mute",
  });

  const soundboardA = await api.setVMCommand({
    cmd: "get_float",
    param: "Strip[0].A1",
  });
  const soundboardGain = await api.setVMCommand({
    cmd: "get_float",
    param: "Strip[0].Gain",
  });
  const soundboardMute = await api.setVMCommand({
    cmd: "get_float",
    param: "Strip[0].Mute",
  });

  const outputGain = await api.setVMCommand({
    cmd: "get_float",
    param: "Bus[0].Gain",
  });

  const outputMute = await api.setVMCommand({
    cmd: "get_float",
    param: "Bus[0].Mute",
  });

  return {
    input: {
      a: inputA.float_value,
      gain: inputGain.float_value,
      mute: inputMute.float_value,
    },
    soundboard: {
      a: soundboardA.float_value,
      gain: soundboardGain.float_value,
      mute: soundboardMute.float_value,
    },
    output: { gain: outputGain.float_value, mute: outputMute.float_value },
  };
};

export function useContainerWidth(ref: React.RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry.contentRect.width);
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}
