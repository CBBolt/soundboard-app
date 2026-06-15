import { useEffect, useState } from "react";

import SoundTile from "../components/Sound/SoundTile";

// import { audioEngine } from "../audio/AudioEngine";
import SquareIcon from "../icons/SquareIcon";
import HotkeyComponent from "../components/Hotkey/HotkeyComponent";

export default function ControllerApp() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const loadSounds = async () => {
    const savedSounds = await window.electronAPI.getSounds();

    setSounds(savedSounds);
  };

  const loadSettings = async () => {
    const settings = await window.electronAPI.readSettings();

    setSettings(settings);
  };

  const reload = async () => {
    await loadSettings();
    await loadSounds();
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onMainRecieved(async (data) => {
      if (data.message === "reload") reload();
    });

    return unsubscribe;
  }, []);

  return (
    <div className="backdrop">
      <div className="titlebar">My Overlay</div>
      <button onClick={() => window.electronAPI.hideController()}>Close</button>
      <div className="flex-gap">
        <SquareIcon className="icon fill sml" />
        <span>All</span>
        {settings && <HotkeyComponent hotkey={settings.stopHotkey} />}
      </div>
      <div
        style={{
          position: "relative",
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          height: 300,
          overflowY: "auto",
        }}
      >
        {sounds.map((sound) => (
          <SoundTile
            key={sound.id}
            sound={sound}
            playSound={(sound) => window.electronAPI.sendSound(sound.id)}
            deleteSound={() => {}}
            editSound={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
