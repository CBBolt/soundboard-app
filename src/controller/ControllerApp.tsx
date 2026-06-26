import { useEffect, useState } from "react";
import BoardLayout from "./components/Layouts/Board/BoardLayout";
import RadialLayout from "./components/Layouts/Radial/RadialLayout";
import ConstellationLayout from "./components/Layouts/Constellation/ConstellationLayout";
import HexagonLayout from "./components/Layouts/Hexagon/HexagonLayout";
import DefaultHeader from "./components/Layouts/DefaultHeader";

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

  const getSoundsFromId = (soundIds: number[]) => {
    if (!sounds.length || !soundIds) return [];
    else {
      return soundIds.map(
        (s) => sounds.find((sound) => s === sound.id) ?? null,
      );
    }
  };

  const renderBody = () => {
    if (!boardData || !settings) {
      return (
        <div className="grid-gap">
          <DefaultHeader settings={settings!} stop={false} />
          <div>No Board Loaded</div>
        </div>
      );
    }

    const boardSounds = getSoundsFromId(boardData.sounds);
    const key = `${boardData.id}-${boardData.layout}`;

    switch (boardData.layout) {
      case "BOARD":
        return (
          <BoardLayout key={key} settings={settings} sounds={boardSounds} />
        );
      case "RADIAL":
        return (
          <RadialLayout key={key} settings={settings} sounds={boardSounds} />
        );
      case "HEX":
        return (
          <HexagonLayout key={key} settings={settings} sounds={boardSounds} />
        );
      case "CONSTELLATION":
        return (
          <ConstellationLayout
            key={key}
            settings={settings}
            sounds={boardSounds}
          />
        );

      default:
        return <span>Unknown layout: {String(boardData.layout)}</span>;
    }
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onMainRecieved(async (data) => {
      if (data.message === "reload") reload();
      else if (data.message === "board_data") {
        reload();
        setBoardData(data.data as Board);
      }
    });

    return unsubscribe;
  }, []);

  return <div className="backdrop">{renderBody()}</div>;
}
