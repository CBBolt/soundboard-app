import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import RefreshIcon from "../../icons/RefreshIcon";
import MicIcon from "../../icons/MicIcon";
import SpeakerIcon from "../../icons/SpeakerIcon";
import VolumeSlider from "../VolumeSlider";
import MusicNoteIcon from "../../icons/MusicNoteIcon";
import VMDeviceDriverSelector from "./VMDeviceDriverSelector";
import HeadphoneIcon from "../../icons/HeadphoneIcon";
import QuestionIcon from "../../icons/QuestionIcon";
import GearIcon from "../../icons/GearIcon";
import { truncateText } from "../../lib/helpers";

type VoiceMeeterProps = {
  outputDevices: AudioDevice[];
  selectedOutputDevice: VMAudioDevice;
  inputDevices: AudioDevice[];
  selectedInputDevice: VMAudioDevice;
  loadVMConfig: () => object;
  onSave: (data: {
    currentInputDevice: VMAudioDevice;
    currentOutputDevice: VMAudioDevice;
  }) => void;
  loadDevices: () => void;
};

type VMChannel = {
  mute: boolean;
  a: boolean;
  gain: number;
};

type VMConfig = {
  expand: boolean;
  currentInputDevice: VMAudioDevice;
  inputChannel: VMChannel;
  soundboardChannel: VMChannel;
  currentOuputDevice: VMAudioDevice;
  outputChannel: VMChannel;
  helper: boolean;
};

type VMChannelKey = "inputChannel" | "soundboardChannel" | "outputChannel";

export default function VoiceMeeterPanel({
  onSave,
  loadDevices,
  loadVMConfig,
  outputDevices,
  inputDevices,
  selectedInputDevice,
  selectedOutputDevice,
}: VoiceMeeterProps) {
  const [config, setConfig] = useState<VMConfig>({
    currentInputDevice: selectedInputDevice,
    currentOuputDevice: selectedOutputDevice,
    helper: false,
    expand: false,
    inputChannel: {
      mute: false,
      a: true,
      gain: 0,
    },
    soundboardChannel: {
      mute: false,
      a: true,
      gain: 0,
    },
    outputChannel: {
      mute: false,
      a: false,
      gain: 0,
    },
  });

  useEffect(() => {
    const load = async () => {
      const config = await loadVMConfig();

      const configObj = config as {
        input: { a: number; gain: number; mute: number };
        soundboard: { a: number; gain: number; mute: number };
        output: { mute: number; gain: number };
      };

      setConfig((prev) => ({
        ...prev,
        inputChannel: {
          ...prev.inputChannel,
          a: configObj.input.a === 1,
          gain: configObj.input.gain,
          mute: configObj.input.mute === 1,
        },
        soundboardChannel: {
          ...prev.soundboardChannel,
          a: configObj.soundboard.a === 1,
          gain: configObj.soundboard.gain,
          mute: configObj.soundboard.mute === 1,
        },
        outputChannel: {
          ...prev.outputChannel,
          mute: configObj.output.mute === 1,
          gain: configObj.output.gain,
        },
      }));
    };

    load();
  }, []);

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

    if (!update.success) {
      console.error(update.message);
      return;
    }
  }

  const muteButton = (
    channel: VMChannelKey,
    param: string,
    icon: "note" | "speaker" | "mic",
    smaller: boolean = false,
  ): React.ReactNode => {
    const style: React.CSSProperties = {
      fill: config[channel].mute ? "tomato" : "",
    };

    const iconNode = () => {
      switch (icon) {
        case "note":
          return (
            <MusicNoteIcon
              className={`icon fill ${smaller ? "sml" : ""}`}
              style={style}
            />
          );
        case "speaker":
          return (
            <SpeakerIcon
              className={`icon fill ${smaller ? "sml" : ""}`}
              style={style}
            />
          );
        case "mic":
          return (
            <MicIcon
              className={`icon fill ${smaller ? "sml" : ""}`}
              style={style}
            />
          );
      }
    };

    return (
      <div
        className="icon-btn grey"
        onClick={() =>
          setConfig((prev) => {
            const next = !prev[channel].mute;

            updateVMParam({
              param: `${param}.Mute`,
              float: true,
              value: next ? 1 : 0,
            });

            return {
              ...prev,
              [channel]: {
                ...prev[channel],
                mute: next,
              },
            };
          })
        }
      >
        {iconNode()}
      </div>
    );
  };

  const aButton = (
    channel: VMChannelKey,
    param: string,
    smaller: boolean = false,
  ): React.ReactNode => {
    const style: React.CSSProperties = {
      fill: config[channel].a ? "var(--base-color)" : "",
      stroke: "white",
    };

    return (
      <div
        className="icon-btn grey"
        onClick={() =>
          setConfig((prev) => {
            const next = !prev[channel].a;

            updateVMParam({
              param: `${param}.A1`,
              float: true,
              value: next ? 1 : 0,
            });

            return {
              ...prev,
              [channel]: {
                ...prev[channel],
                a: next,
              },
            };
          })
        }
      >
        <HeadphoneIcon
          className={`icon fill ${smaller ? "sml" : ""}`}
          style={style}
        />
      </div>
    );
  };

  const api = window.electronAPI;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.5fr 1fr",
          gap: 10,
          position: "relative",
          background: "rgba(0, 0, 0, 0.75)",
          boxShadow: "black 1px 1px 10px 1px",
          padding: 2,
          borderRadius: 5,
          fontSize: "smaller",
          textAlign: "left",
        }}
      >
        <div className="flex-gap">
          {muteButton("soundboardChannel", "Strip[0]", "note", true)}
          {aButton("soundboardChannel", "Strip[0]", true)}
        </div>
        <span>Soundboard</span>

        <div className="flex-gap">
          {muteButton("inputChannel", "Strip[1]", "mic", true)}
          {aButton("inputChannel", "Strip[1]", true)}
        </div>
        <span>{truncateText(config.currentInputDevice.name, 30)}</span>

        <div className="flex-gap">
          {muteButton("outputChannel", "Bus[0]", "speaker", true)}
        </div>
        <span>{truncateText(config.currentOuputDevice.name, 30)}</span>
        <div style={{ position: "absolute", top: "0", right: 0 }}>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, expand: true }))}
          >
            <div className="flex-gap">
              <GearIcon className="icon stroke sml" />
            </div>
          </button>
        </div>
      </div>
      <Modal
        isOpen={config.expand}
        onClose={() => setConfig((prev) => ({ ...prev, expand: false }))}
        header={
          <>
            <MusicNoteIcon className="icon fill" />
            <span>VoiceMeeter Setup</span>
          </>
        }
      >
        <div className="flex-gap">
          <div style={{ display: "grid", gap: 10 }}>
            <div className="flex-gap">
              <div className="flex-gap">
                {muteButton("soundboardChannel", "Strip[0]", "note")}
                {aButton("soundboardChannel", "Strip[0]")}
              </div>
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
                      soundboardChannel: {
                        ...prev.soundboardChannel,
                        gain: val,
                      },
                    }));
                  }}
                />
              </div>
            </div>

            <div className="flex-gap">
              <div className="flex-gap">
                {muteButton("inputChannel", "Strip[1]", "mic")}
                {aButton("inputChannel", "Strip[1]")}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <VMDeviceDriverSelector
                  currentDevice={config.currentInputDevice}
                  devices={inputDevices}
                  onChange={async (device) => {
                    setConfig((prev) => ({
                      ...prev,
                      currentInputDevice: device,
                    }));

                    onSave({
                      currentInputDevice: device,
                      currentOutputDevice: config.currentOuputDevice,
                    });

                    await api.setVMCommand({
                      cmd: "set_string",
                      param: `Strip[1].Device.${device.driver}`,
                      string_value: device.name,
                    });

                    await api.updateSettings({
                      defaultInputDevice: device,
                    });
                  }}
                />
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
            </div>
            <div className="flex-gap">
              {muteButton("outputChannel", "Bus[0]", "speaker")}
              <div style={{ display: "grid", gap: 10 }}>
                <VMDeviceDriverSelector
                  currentDevice={config.currentOuputDevice}
                  devices={outputDevices}
                  onChange={async (device) => {
                    setConfig((prev) => ({
                      ...prev,
                      currentOuputDevice: device,
                    }));

                    onSave({
                      currentInputDevice: config.currentInputDevice,
                      currentOutputDevice: device,
                    });

                    await api.setVMCommand({
                      cmd: "set_string",
                      param: `Bus[0].Device.${device.driver}`,
                      string_value: device.name,
                    });

                    await api.updateSettings({
                      defaultOutputDevice: device,
                    });
                  }}
                />
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
            </div>
          </div>
        </div>

        <Modal
          isOpen={config.helper}
          onClose={() => setConfig((prev) => ({ ...prev, helper: false }))}
          header={
            <>
              <QuestionIcon className="icon fill" />
              <span>VoiceMeeter Helper</span>
            </>
          }
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div className="flex-gap">
              <RefreshIcon className="icon stroke" />
              Refresh all devices
            </div>
            <div className="flex-gap">
              <div className="icon-btn grey">
                <MicIcon className="icon fill" />
              </div>
              Toggle for muting different tracks (sounboard, mic, speakers)
            </div>
            <div className="flex-gap">
              <div className="icon-btn grey">
                <HeadphoneIcon className="icon fill" />
              </div>
              Toggle for monitoring sounds or playing them through the game.
              This is useful if you want to hear the sounboard or yourself talk
              for mic testing.
            </div>
            <div className="flex-gap">
              <div className="icon-btn grey">WDM / MME</div>
              This is a VoiceMeeter thing, but basically is the default device
              driver (WDM) and legacy driver (MME). The toggle is there for
              convience in case WDM doesn't work.
            </div>
          </div>
        </Modal>

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
          <button
            onClick={() => setConfig((prev) => ({ ...prev, helper: true }))}
          >
            <QuestionIcon className="icon fill" />
          </button>
          <button onClick={loadDevices}>
            <div className="flex-gap">
              <RefreshIcon className="icon stroke" />
            </div>
          </button>
        </div>
      </Modal>
    </>
  );
}
