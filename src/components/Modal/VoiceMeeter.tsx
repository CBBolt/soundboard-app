import { useState } from "react";
import Modal from "./Modal";
import RefreshIcon from "../../icons/RefreshIcon";
import MicIcon from "../../icons/MicIcon";
import SpeakerIcon from "../../icons/SpeakerIcon";
import VolumeSlider from "../VolumeSlider";
import MusicNoteIcon from "../../icons/MusicNoteIcon";

type VoiceMeeterProps = {
  show: boolean;
  outputDevices: AudioDevice[];
  selectedOutputDevice: string;
  inputDevices: AudioDevice[];
  selectedInputDevice: string;
  onClose: () => void;
  onSave: (data: {
    currentInputDevice: string;
    currentOutputDevice: string;
  }) => void;
  loadDevices: () => void;
};

type VMChannel = {
  driverType: "WDM" | "MME";
  mute: boolean;
  a: boolean;
  gain: number;
};

type VMConfig = {
  currentInputDevice: string;
  inputChannel: VMChannel;
  soundboardChannel: VMChannel;
  currentOuputDevice: string;
  outputChannel: VMChannel;
};

export default function VoiceMeeter({
  show,
  onClose,
  onSave,
  loadDevices,
  outputDevices,
  inputDevices,
  selectedInputDevice,
  selectedOutputDevice,
}: VoiceMeeterProps) {
  const [config, setConfig] = useState<VMConfig>({
    currentInputDevice: selectedInputDevice,
    currentOuputDevice: selectedOutputDevice,
    inputChannel: { driverType: "WDM", mute: false, a: true, gain: 0 },
    soundboardChannel: {
      driverType: "WDM",
      mute: false,
      a: true,
      gain: 0,
    },
    outputChannel: {
      driverType: "WDM",
      mute: false,
      a: false,
      gain: 0,
    },
  });

  async function updateVMParam(data: {
    param: string;
    float: boolean;
    value: string | number;
  }) {
    const { param, float, value } = data;

    const upd = await api.setVMCommand({
      cmd: float ? "set_float" : "set_string",
      param,
      string_value: float ? undefined : (value as string),
      value: float ? (value as number) : undefined,
    });

    const update = upd as {
      success: boolean;
      message: string;
    };

    console.log(update);

    if (!update.success) {
      console.error(update.message);
      return;
    }
  }

  const api = window.electronAPI;

  return (
    <Modal isOpen={show} onClose={onClose}>
      <div className="flex-gap">
        <div style={{ display: "grid", gap: 10 }}>
          <div className="flex-gap">
            <MusicNoteIcon className="icon fill" />
            <div style={{ display: "grid", gap: 10 }}>
              <span>Soundboard Output</span>
              <VolumeSlider
                min={-10}
                max={12}
                percentage={false}
                value={config.soundboardChannel.gain}
                onChange={async (val) => {
                  await api.setVMCommand({
                    cmd: "set_float",
                    param: "Strip[0].Gain",
                    value: val,
                  });

                  setConfig((prev) => ({
                    ...prev,
                    soundboardChannel: { ...prev.soundboardChannel, gain: val },
                  }));
                }}
              />
            </div>

            <button
              onClick={() => {
                setConfig((prev) => {
                  const next = !prev.soundboardChannel.a;

                  updateVMParam({
                    param: "Strip[0].a1",
                    float: true,
                    value: next ? 1 : 0,
                  });

                  return {
                    ...prev,
                    soundboardChannel: { ...prev.soundboardChannel, a: next },
                  };
                });
              }}
            >
              {config.soundboardChannel.a ? "Hear in Game" : "Hear Locally"}
            </button>
            <button
              onClick={() => {
                setConfig((prev) => {
                  const next = !prev.soundboardChannel.mute;

                  updateVMParam({
                    param: "Strip[0].Mute",
                    float: true,
                    value: next ? 1 : 0,
                  });

                  return {
                    ...prev,
                    soundboardChannel: {
                      ...prev.soundboardChannel,
                      mute: next,
                    },
                  };
                });
              }}
            >
              Mute
            </button>
          </div>
          <div className="flex-gap">
            <MicIcon className="icon fill" />
            <div style={{ display: "grid", gap: 10 }}>
              <select
                value={config.currentInputDevice}
                onChange={async (e) => {
                  setConfig((prev) => ({
                    ...prev,
                    currentInputDevice: e.target.value,
                  }));

                  onSave({
                    currentInputDevice: e.target.value,
                    currentOutputDevice: config.currentOuputDevice,
                  });

                  const label = inputDevices.find(
                    (d) => d.id === e.target.value,
                  )?.label;

                  await api.setVMCommand({
                    cmd: "set_string",
                    param: `Strip[1].Device.${config.inputChannel.driverType}`,
                    string_value: label,
                  });
                }}
              >
                {inputDevices
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label || `Input ${d.id}`}
                    </option>
                  ))}
              </select>
              <VolumeSlider
                min={-10}
                max={12}
                percentage={false}
                value={config.inputChannel.gain}
                onChange={async (val) => {
                  await api.setVMCommand({
                    cmd: "set_float",
                    param: "Strip[1].Gain",
                    value: val,
                  });

                  setConfig((prev) => ({
                    ...prev,
                    inputChannel: { ...prev.inputChannel, gain: val },
                  }));
                }}
              />
            </div>

            <button
              onClick={() => {
                setConfig((prev) => {
                  const next =
                    prev.inputChannel.driverType === "WDM" ? "MME" : "WDM";

                  return {
                    ...prev,
                    inputChannel: { ...prev.inputChannel, driverType: next },
                  };
                });
              }}
            >
              {config.inputChannel.driverType}
            </button>

            <button
              onClick={() => {
                setConfig((prev) => {
                  const next = !prev.inputChannel.a;

                  updateVMParam({
                    param: "Strip[1].a1",
                    float: true,
                    value: next ? 1 : 0,
                  });

                  return {
                    ...prev,
                    inputChannel: { ...prev.inputChannel, a: next },
                  };
                });
              }}
            >
              {config.inputChannel.a ? "Hear in Game" : "Hear Locally"}
            </button>
            <button
              onClick={() => {
                setConfig((prev) => {
                  const next = !prev.inputChannel.mute;

                  updateVMParam({
                    param: "Strip[1].Mute",
                    float: true,
                    value: next ? 1 : 0,
                  });

                  return {
                    ...prev,
                    inputChannel: { ...prev.inputChannel, mute: next },
                  };
                });
              }}
            >
              Mute
            </button>
          </div>
          <div className="flex-gap">
            <SpeakerIcon className="icon fill" />
            <div style={{ display: "grid", gap: 10 }}>
              <select
                value={config.currentOuputDevice}
                onChange={async (e) => {
                  setConfig((prev) => ({
                    ...prev,
                    currentOuputDevice: e.target.value,
                  }));

                  onSave({
                    currentInputDevice: config.currentInputDevice,
                    currentOutputDevice: e.target.value,
                  });

                  const label = outputDevices.find(
                    (d) => d.id === e.target.value,
                  )?.label;

                  await api.setVMCommand({
                    cmd: "set_string",
                    param: `Bus[0].Device.${config.outputChannel.driverType}`,
                    string_value: label,
                  });
                }}
              >
                {outputDevices
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label || `Output ${d.id}`}
                    </option>
                  ))}
              </select>
              <VolumeSlider
                min={-10}
                max={12}
                percentage={false}
                value={config.outputChannel.gain}
                onChange={async (val) => {
                  await api.setVMCommand({
                    cmd: "set_float",
                    param: "Bus[0].Gain",
                    value: val,
                  });

                  setConfig((prev) => ({
                    ...prev,
                    outputChannel: { ...prev.outputChannel, gain: val },
                  }));
                }}
              />
            </div>

            <button
              onClick={() => {
                setConfig((prev) => {
                  const next =
                    prev.outputChannel.driverType === "WDM" ? "MME" : "WDM";

                  return {
                    ...prev,
                    outputChannel: {
                      ...prev.outputChannel,
                      driverType: next,
                    },
                  };
                });
              }}
            >
              {config.outputChannel.driverType}
            </button>
            <button
              onClick={() => {
                setConfig((prev) => {
                  const next = !prev.outputChannel.mute;

                  updateVMParam({
                    param: "Bus[0].Mute",
                    float: true,
                    value: next ? 1 : 0,
                  });

                  return {
                    ...prev,
                    outputChannel: {
                      ...prev.outputChannel,
                      mute: next,
                    },
                  };
                });
              }}
            >
              Mute
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex-gap"
        style={{
          position: "absolute",
          top: 0,
          right: 50,
          justifyContent: "center",
          marginTop: "10px",
        }}
      >
        <button onClick={loadDevices}>
          <div className="flex-gap">
            <RefreshIcon className="icon stroke" />
          </div>
        </button>
      </div>
    </Modal>
  );
}
