import { useEffect, useState } from "react";
import BoardLayout from "./components/Layouts/Board/BoardLayout";

export default function ControllerApp() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [boardData, setBoardData] = useState<Board | null>(null);

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

  const getSoundsFromId = (soundIds: number[]) =>
    soundIds.map((s) => sounds.find((sound) => s === sound.id) ?? null);

  const renderBody = () => {
    if (!boardData || !settings) return <span>No Board Loaded</span>;

    const boardSounds = getSoundsFromId(boardData.sounds);

    switch (boardData.layout) {
      case "BOARD":
        return <BoardLayout settings={settings} sounds={boardSounds} />;
    }
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onMainRecieved(async (data) => {
      if (data.message === "reload") reload();
      else if (data.message === "board_data") setBoardData(data.data as Board);
    });

    return unsubscribe;
  }, []);

  return <div className="backdrop">{renderBody()}</div>;
}
