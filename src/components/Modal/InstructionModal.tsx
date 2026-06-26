import { useState } from "react";

import Modal from "./Modal";
import QuestionIcon from "../../icons/QuestionIcon";
import { useTutorial } from "../../tutorial/TutorialContext";
import {
  boards,
  overlay,
  tags,
  vmSetup,
  vmUse,
  sounds,
} from "../../tutorial/tutorials/tutorialSteps";

type Props = {
  VBDetected: VBDetected;
  show: boolean;
  onClose: () => void;
};

export default function InstructionModal({ VBDetected, show, onClose }: Props) {
  const [curTab, setCurTab] = useState<"START" | "VOICE">("START");
  const { startFlow } = useTutorial();

  const renderInstructions = () => {
    switch (curTab) {
      case "START":
        return (
          <div>
            <h2>Tutorials</h2>
            <ul>
              <li>
                <button
                  onClick={() => {
                    onClose();
                    startFlow(sounds, "sounds");
                  }}
                >
                  Sounds
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onClose();
                    startFlow(boards, "boards");
                  }}
                >
                  Boards
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onClose();
                    startFlow(tags, "tags");
                  }}
                >
                  Tags
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onClose();
                    startFlow(vmSetup, "vmSetup");
                  }}
                >
                  VoiceMeeter Setup
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onClose();
                    startFlow(vmUse, "vmUse");
                  }}
                >
                  VoiceMeeter Toggle
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onClose();
                    startFlow(overlay, "overlay");
                  }}
                >
                  Overlay
                </button>
              </li>
            </ul>
          </div>
        );
      case "VOICE":
        return (
          <div data-tour="vm-instructions">
            <ol>
              <li>
                Install VoiceMeeter and VB Cable:
                <ol type="a">
                  <li>
                    <a
                      target="_blank"
                      href="https://vb-audio.com/Voicemeeter/index.htm"
                    >
                      VoiceMeeter
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
              <li>Restart your computer</li>
              {VBDetected.voicemeeter ? (
                <li>Come back here after you restart to continue</li>
              ) : (
                <li>
                  Open the sound panel to disable unneeded devices:
                  <button
                    data-tour="sound-panel-btn"
                    onClick={async () => window.electronAPI.disableVBAudio()}
                    style={{ marginLeft: 10 }}
                  >
                    Open Sound Panel
                  </button>
                  <br />
                  <ol type="a">
                    <li>
                      In <strong>Playback</strong> tab disable all VoiceMeeter
                      Devices (right click &gt; disable) until just{" "}
                      <strong>Voicemeeter In 1</strong> is enabled
                    </li>
                    <li>
                      In <strong>Recording</strong> tab disable all VoiceMeeter
                      Devices (right click &gt; disable) until just{" "}
                      <strong>Voicemeeter Out A1</strong> and{" "}
                      <strong>Voicemeeter Out B1</strong> are enabled
                    </li>
                  </ol>
                </li>
              )}
            </ol>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      header={
        <>
          <QuestionIcon className="icon fill" />
          <h2>Setup</h2>
        </>
      }
    >
      <div data-tour="help-menu">
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
            data-tour="vm-setup-btn"
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
        </div>

        {(VBDetected.vbCable || VBDetected.voicemeeter) && (
          <div className="panel">
            {VBDetected.vbCable && <div>VB Cable Installed!</div>}
            {VBDetected.voicemeeter && <div>VoiceMeeter Installed!</div>}
          </div>
        )}

        <div className="seperator" />

        <div style={{ textAlign: "left", maxHeight: 400, overflowY: "auto" }}>
          {renderInstructions()}
        </div>
      </div>
    </Modal>
  );
}
