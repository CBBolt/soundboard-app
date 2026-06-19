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
import SquareIcon from "../../icons/SquareIcon";

type BoardComponentProps = {
  board: Board;
  sounds: Sound[];
  playSound: (sound: Sound) => void;
  onSetBoard: (id: number) => void;
  onSave: (board: Board) => void;
  onDelete: (boardId: number) => void;
};

type BoardConfig = {
  draggedIndex: number | null;
  dropIndex: number | null;
  board: Board;
};

export default function BoardComponent({
  board,
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

  function moveItem<T>(array: T[], from: number, to: number) {
    const copy = [...array];

    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);

    return copy;
  }

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
                <SoundboardIcon className="icon stroke" />
              ) : e === "RADIAL" ? (
                <RadialIcon className="icon fill" />
              ) : e === "CONSTELLATION" ? (
                <ConstellationIcon className="icon stroke" />
              ) : (
                <HexIcon className="icon fill" />
              )}
            </button>
          ))}
          <div className="seperator vertical light" />
          <button onClick={() => onSetBoard(board.id)}>
            <SquareIcon className="icon fill" />
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
          height: 200,
          overflowY: "auto",
          padding: "5px",
        }}
      >
        {[...config.board.sounds, -1].map((soundId, i) => {
          if (soundId === -1) {
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
            config.board.sounds && config.board.sounds[i]
              ? sounds.find((s) => s.id === config.board.sounds[i])!
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
                  if (config.draggedIndex === null || config.draggedIndex === i)
                    return;

                  setConfig((prev) => ({
                    ...prev,
                    board: {
                      ...prev.board,
                      sounds: moveItem(
                        prev.board.sounds,
                        config.draggedIndex!,
                        i,
                      ),
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
                  if (id === -1) {
                    return {
                      ...prev,
                      board: {
                        ...prev.board,
                        sounds: prev.board.sounds.filter((_, idx) => idx !== i),
                      },
                    };
                  }

                  const sounds = [...prev.board.sounds];
                  sounds[i] = id;

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
