import { useEffect, useState } from "react";
import TrashIcon from "../../icons/TrashIcon";
import { boardLayoutTypes } from "./_types/board";
import SaveIcon from "../../icons/SaveIcon";
import BoardTile from "./BoardTile";

type BoardComponentProps = {
  board: Board;
  sounds: Sound[];
  onSave: (board: Board) => void;
  onDelete: (boardId: number) => void;
};

type BoardConfig = {
  board: Board;
};

export default function BoardComponent({
  board,
  sounds,
  onSave,
  onDelete,
}: BoardComponentProps) {
  const [config, setConfig] = useState<BoardConfig>({
    board: {
      ...board,
      sounds: board.sounds ?? Array.from({ length: 50 }).map(() => 0),
    },
  });

  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      board: {
        ...board,
        sounds: board.sounds ?? Array.from({ length: 50 }).map(() => 0),
      },
    }));
  }, [board]);

  return (
    <>
      <div className="flex-gap">
        <input
          value={config.board.name}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              board: { ...prev.board, name: e.target.value },
            }))
          }
        />
        <div className="flex-gap">
          {boardLayoutTypes.map((e, i) => (
            <button
              key={i}
              style={{ background: config.board.layout === e ? "red" : "" }}
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  board: { ...prev.board, layout: e },
                }))
              }
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex-gap">
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
        {config.board.sounds.map((_, i) => {
          const sound =
            config.board.sounds && config.board.sounds[i]
              ? sounds.find((s) => s.id === config.board.sounds[i])!
              : null;

          return (
            <BoardTile
              key={i}
              sounds={sounds}
              sound={sound}
              setSound={(id) => {
                const sounds = config.board.sounds;
                sounds[i] = id;
                setConfig((prev) => ({
                  ...prev,
                  board: { ...prev.board, sounds },
                }));
              }}
            />
          );
        })}
      </div>
    </>
  );
}
