import { useState } from "react";

import Modal from "./Modal";
import QuestionIcon from "../../icons/QuestionIcon";
import PlusIcon from "../../icons/PlusIcon";
import GearIcon from "../../icons/GearIcon";
import SquareIcon from "../../icons/SquareIcon";
import RefreshIcon from "../../icons/RefreshIcon";

type Props = {
  VBDetected: {
    voicemeter: boolean;
    vbCable: boolean;
  };
  show: boolean;
  onClose: () => void;
};

export default function InstructionModal({ VBDetected, show, onClose }: Props) {
  const [curTab, setCurTab] = useState<"START" | "VOICE" | "HOWTO">("START");

  const renderInstructions = () => {
    switch (curTab) {
      case "START":
        return (
          <div>
            <div className="panel">
              {VBDetected.vbCable && <div>VB Cable Installed!</div>}
              {VBDetected.voicemeter && <div>VoiceMeeter Installed!</div>}
            </div>
            <p>
              VoiceMeeter and VB Cable are intended to be used with this
              soundboard. Follow the below steps to get started:
            </p>
            <ol>
              <li>
                Install VoiceMeeter and VB Cable:
                <ol type="a">
                  <li>
                    <a
                      target="_blank"
                      href="https://vb-audio.com/Voicemeeter/banana.htm"
                    >
                      VoiceMeeter Banana
                    </a>
                  </li>
                  <li>
                    <a target="_blank" href="https://vb-audio.com/Cable/">
                      VB Cable
                    </a>
                  </li>
                  <li>
                    If the links don't work, you can go to the official website:{" "}
                    <a target="_blank" href="https://vb-audio.com/index.htm">
                      VB Audio
                    </a>{" "}
                    &gt; Audio Apps
                  </li>
                </ol>
              </li>
              <li>
                Once both apps are downloaded (you will probably need to restart
                your computer), you'll see a bunch of new input and output
                devices. The next step is to disable all the unneeded ones both
                for some cleanup, and to make it not show 10+ devices all the
                time
              </li>
              <li>
                Open the sound panel:
                <button
                  onClick={async () => window.electronAPI.disableVBAudio()}
                  style={{ marginLeft: 10 }}
                >
                  Open Sound Panel
                </button>
                <br />
                <ol type="a">
                  <li>
                    Then in the <strong>Playback</strong> tab disable all
                    VoiceMeeter Devices (right click &gt; disable) until just{" "}
                    <strong>Voicemeeter In 1</strong> is enabled
                  </li>
                  <li>
                    In the <strong>Recording</strong> tab disable all
                    VoiceMeeter Devices (right click &gt; disable) until just{" "}
                    <strong>Voicemeeter Out A1</strong> and{" "}
                    <strong>Voicemeeter Out B1</strong> are enabled
                  </li>
                </ol>
              </li>
            </ol>
            <div className="seperator" />
            <p>
              Once you get the above setup, move to the{" "}
              <strong>VoiceMeeter Setup</strong> section for next steps
            </p>
          </div>
        );
      case "VOICE":
        return (
          <div>
            <p>
              Now with VoiceMeeter and VB Cable setup, this is how VoiceMeeter
              should be setup:
            </p>
            <div
              style={{
                display: "grid",
                justifyItems: "center",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gridTemplateRows: "1fr 1fr",
                  justifyItems: "center",
                  gap: 10,
                  padding: 10,
                  color: "white",
                  background: "#222",
                  border: "1px solid #333",
                  height: 200,
                  width: "85%",
                }}
              >
                <div>
                  Soundboard
                  <div style={{ fontSize: "small" }}>Cable Output</div>
                </div>
                <div>Mic</div>
                <div>
                  Virtual Out
                  <div style={{ fontSize: "small" }}>VoiceMeeter Out A1</div>
                </div>
                <div>Hardware Out</div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      background: "tomato",
                      border: "1px solid white",
                      borderRadius: 5,
                      height: 30,
                      width: 30,
                    }}
                  >
                    A
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      background: "#5597d9",
                      border: "1px solid white",
                      borderRadius: 5,
                      height: 30,
                      width: 30,
                    }}
                  >
                    B
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      background: "tomato",
                      border: "1px solid white",
                      borderRadius: 5,
                      height: 30,
                      width: 30,
                    }}
                  >
                    A
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      background: "#5597d9",
                      border: "1px solid white",
                      borderRadius: 5,
                      height: 30,
                      width: 30,
                    }}
                  >
                    B
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    background: "tomato",
                    border: "1px solid white",
                    borderRadius: 5,
                    height: 30,
                    width: 30,
                  }}
                >
                  A
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    background: "#5597d9",
                    border: "1px solid white",
                    borderRadius: 5,
                    height: 30,
                    width: 30,
                  }}
                >
                  B
                </div>
              </div>
            </div>
            <p>
              Notice that both soundboard and mic have both A and B channels
              whereas Virtual / Hardware Out only have A and B respectively. You
              can use this to either hear yourself in VoiceMeeter (B) or just
              have it go to the Virtual Output (A). There are also Gain (Volume)
              sliders you can use to increase volume and mute the channels if
              needed
            </p>
          </div>
        );
      case "HOWTO":
        return (
          <div>
            <div className="flex-gap">
              <PlusIcon className="icon fill" />
              Add Sound from File or Record a new one
            </div>
            <div className="flex-gap">
              <GearIcon className="icon stroke" />
              Settings
            </div>
            <div className="flex-gap">
              <SquareIcon className="icon fill" />
              Stops all actively playing sounds
            </div>
            <div className="flex-gap">
              <RefreshIcon className="icon stroke" />
              Refreshes sound devices
            </div>
            <div className="seperator" />
            <p>
              Click a tile to play the sound and hover over the{" "}
              <strong>top</strong> of the tile to trigger the editor
            </p>
            <br />
            <p>
              The background of the tile shows the current volume of the tile
            </p>
            <div className="seperator" />
            <p>
              This app also uses hotkeys to trigger sounds. Just be mindful that
              the hotkeys <strong>will</strong> trigger if the app is still
              open.
            </p>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={show} onClose={onClose}>
      <div
        className="flex-gap"
        style={{ position: "absolute", top: 15, left: 15 }}
      >
        <QuestionIcon className="icon stroke" />
        <h2>Setup</h2>
      </div>
      <div>
        <div className="flex-gap">
          <button
            style={{
              background:
                curTab === "START"
                  ? "oklch(from var(--base-color) l calc(c * 0.8) h"
                  : "",
            }}
            onClick={() => setCurTab("START")}
          >
            Start Here
          </button>
          <button
            style={{
              background:
                curTab === "VOICE"
                  ? "oklch(from var(--base-color) l calc(c * 0.8) h"
                  : "",
            }}
            onClick={() => setCurTab("VOICE")}
          >
            VoiceMeeter Setup
          </button>
          <button
            style={{
              background:
                curTab === "HOWTO"
                  ? "oklch(from var(--base-color) l calc(c * 0.8) h"
                  : "",
            }}
            onClick={() => setCurTab("HOWTO")}
          >
            How To
          </button>
        </div>

        <div className="seperator" />

        <div style={{ textAlign: "left", maxHeight: 500, overflowY: "auto" }}>
          {renderInstructions()}
        </div>
      </div>
    </Modal>
  );
}
