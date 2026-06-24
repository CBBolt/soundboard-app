import { useEffect, useState } from "react";
import TrashIcon from "../../icons/TrashIcon";
import { boardLayoutTypes } from "./_types/board";
import SaveIcon from "../../icons/SaveIcon";
import BoardTile from "./BoardTile";
import RadialIcon from "../../icons/RadialIcon";
import HexIcon from "../../icons/HexIcon";
import ConstellationIcon from "../../icons/ConstellationIcon";
import SoundboardIcon from "../../icons/SoundboardIcon";
import PlusIcon from "../../icons/PlusIcon";

import styles from "./_styles/BoardTile.module.css";
import LoadIcon from "../../icons/LoadIcon";

type BoardComponentProps = {
  board: Board;
  sounds: Sound[];
  playSound: (sound: Sound) => void;
  onSetBoard: (id: number) => void;
  onSave: (board: Board) => void;
  onDelete: (boardId: number) => void;
  loadedBoard?: Board;
};

type BoardConfig = {
  draggedIndex: number | null;
  dropIndex: number | null;
  board: Board;
};

export default function BoardComponent({
  board,
  loadedBoard,
  sounds,
  playSound,
  onSetBoard,
  onSave,
  onDelete,
}: BoardComponentProps) {
  const [config, setConfig] = useState<BoardConfig>({
    draggedIndex: null,
    dropIndex: null,
    board: {
      ...board,
      sounds: board.sounds ?? [],
    },
  });

  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      board: {
        ...board,
        sounds: board.sounds ?? [],
      },
    }));
  }, [board]);

  function moveItem<T>(array: T[], i: number, j: number) {
    const copy = [...array];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }

  const displayItems = [...config.board.sounds, null];

  return (
    <>
      <div
        className="grid-gap"
        style={{ margin: "10px 0px", gridTemplateColumns: "1fr 1fr" }}
      >
        <input
          style={{ width: "75%" }}
          value={config.board.name}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              board: { ...prev.board, name: e.target.value },
            }))
          }
        />
        <div
          className="flex-gap grey"
          style={{ justifyContent: "center", padding: 5, borderRadius: 5 }}
        >
          {boardLayoutTypes.map((e, i) => (
            <button
              key={i}
              style={{
                border: config.board.layout === e ? "2px solid white" : "",
                background:
                  config.board.layout === e
                    ? ""
                    : "oklch(from var(--base-color) calc(l * 1.2) c h)",
              }}
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  board: { ...prev.board, layout: e },
                }))
              }
            >
              {e === "BOARD" ? (
                <SoundboardIcon
                  className="icon stroke"
                  data-tooltip="Soundboard Layout"
                />
              ) : e === "RADIAL" ? (
                <RadialIcon
                  className="icon fill"
                  data-tooltip="Radial Layout"
                />
              ) : e === "CONSTELLATION" ? (
                <ConstellationIcon
                  className="icon stroke"
                  data-tooltip="Constellation Layout"
                />
              ) : (
                <HexIcon className="icon fill" data-tooltip="Hexagon Layout" />
              )}
            </button>
          ))}
          <div className="seperator vertical light" />
          <button
            onClick={() =>
              onSetBoard(
                loadedBoard && loadedBoard.id === board.id ? -1 : board.id,
              )
            }
          >
            <LoadIcon
              className="icon fill stroke"
              style={{
                transform:
                  loadedBoard && loadedBoard.id === board.id
                    ? "rotate(180deg)"
                    : "",
              }}
              data-tooltip={
                loadedBoard && loadedBoard.id === board.id
                  ? "Unload Board from Controller"
                  : "Load Board to Controller"
              }
            />
          </button>
          <button onClick={() => onSave(config.board)}>
            <SaveIcon className="icon fill" />
          </button>
          <button onClick={() => onDelete(board.id)}>
            <TrashIcon className="icon stroke" />
          </button>
        </div>
      </div>
      <div
        className="grid-gap"
        style={{
          gridTemplateColumns: "repeat(auto-fit, 100px)",
          width: "calc(100% - 10px)",
          alignItems: "start",
          flex: 1,
          overflowY: "auto",
          padding: 5,
        }}
      >
        {displayItems.map((soundId, i) => {
          const isAddTile = soundId === null;

          const dataIndex = i < config.board.sounds.length ? i : null;
          if (isAddTile) {
            return (
              <div
                className={styles.tile}
                style={{ border: "1px dashed rgba(255, 255, 255, 0.5)" }}
                key="add"
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    board: {
                      ...prev.board,
                      sounds: [...prev.board.sounds, 0],
                    },
                  }));
                }}
              >
                <PlusIcon className="icon fill" style={{ opacity: 0.5 }} />
              </div>
            );
          }

          const sound =
            dataIndex !== null
              ? sounds.find((s) => s.id === config.board.sounds[dataIndex])!
              : null;

          return (
            <BoardTile
              key={i}
              drag={{
                dragged: config.draggedIndex === i,
                dropOver: config.dropIndex === i,
                onDragStart: () =>
                  setConfig((prev) => ({ ...prev, draggedIndex: i })),
                onDragOver: (e) => {
                  e.preventDefault();
                  setConfig((prev) => ({ ...prev, dropIndex: i }));
                },
                onDragEnd: () =>
                  setConfig((prev) => ({
                    ...prev,
                    draggedIndex: null,
                    dropIndex: null,
                  })),
                onDrop: () => {
                  const from = config.draggedIndex;
                  const to = i;

                  if (from === null || from === to) return;

                  // IMPORTANT: ignore drop onto "add tile"
                  if (to === config.board.sounds.length) return;

                  setConfig((prev) => ({
                    ...prev,
                    board: {
                      ...prev.board,
                      sounds: moveItem(prev.board.sounds, from, to),
                    },
                  }));

                  setConfig((prev) => ({
                    ...prev,
                    draggedIndex: null,
                    dropIndex: null,
                  }));
                },
              }}
              sounds={sounds}
              sound={sound}
              playSound={(sound) => playSound(sound)}
              setSound={(id) => {
                setConfig((prev) => {
                  const sounds = [...prev.board.sounds];

                  if (id === -1) {
                    return {
                      ...prev,
                      board: {
                        ...prev.board,
                        sounds: sounds.filter((_, idx) => idx !== dataIndex),
                      },
                    };
                  }

                  sounds[dataIndex!] = id;

                  return {
                    ...prev,
                    board: {
                      ...prev.board,
                      sounds,
                    },
                  };
                });
              }}
            />
          );
        })}
      </div>
    </>
  );
}
