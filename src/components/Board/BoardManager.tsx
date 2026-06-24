import { useEffect, useState } from "react";

import BoardComponent from "./BoardComponent";
import PlusIcon from "../../icons/PlusIcon";
// import BoardScroller from "./BoardScroller";
import Modal from "../Modal/Modal";
import TrashIcon from "../../icons/TrashIcon";
import Carousel from "../Carousel/Carousel";
import LoadIcon from "../../icons/LoadIcon";

type BoardProps = {
  boards: Board[];
  sounds: Sound[];
  playSound: (sound: Sound) => void;
  loadBoards: () => void;
  loadedBoard?: Board;
  onSetLoadedBoard: (id: number) => void;
};

type BoardConfig = {
  curBoardId: number;
  deleteId: number;
};

export default function BoardManager({
  boards,
  sounds,
  playSound,
  loadBoards,
  loadedBoard,
  onSetLoadedBoard,
}: BoardProps) {
  const [config, setConfig] = useState<BoardConfig>({
    curBoardId: -1,
    deleteId: 0,
  });

  const curBoard = boards.find((b) => b.id === config.curBoardId);

  useEffect(() => {
    if (boards.length === 0) return;

    const loadedBoardExists =
      loadedBoard && boards.some((b) => b.id === loadedBoard.id);

    const nextBoardId = loadedBoardExists ? loadedBoard.id : boards[0].id;

    setConfig((prev) => {
      if (prev.curBoardId === nextBoardId) return prev;

      return {
        ...prev,
        curBoardId: nextBoardId,
      };
    });
  }, [boards, loadedBoard]);

  return (
    <>
      <Modal
        isOpen={config.deleteId > 0}
        onClose={() => setConfig((prev) => ({ ...prev, deleteId: -1 }))}
        header={
          <div className="flex-gap">
            <TrashIcon className="icon stroke" />
            Delete Board
          </div>
        }
      >
        <div>Are you sure you want to delete this board?</div>
        <button
          onClick={() => {
            window.electronAPI.deleteBoard(config.deleteId);
            setConfig((prev) => ({
              ...prev,
              curBoardId: boards.length > 0 ? boards[0].id : -1,
              deleteId: -1,
            }));
            loadBoards();
          }}
        >
          Confirm
        </button>
      </Modal>
      <div className="grid-gap">
        {loadedBoard && (
          <div
            className="flex-gap"
            style={{
              border: "2px solid white",
              padding: 5,
              borderRadius: 5,
            }}
          >
            <LoadIcon className="icon fill stroke" />
            {loadedBoard.name}
          </div>
        )}
        <div className="flex-gap">
          <Carousel
            items={boards}
            curItemId={config.curBoardId}
            onSelect={(id) =>
              setConfig((prev) => ({ ...prev, curBoardId: id }))
            }
          />
          <button
            onClick={async () => {
              const newBoard: Partial<Board> = {
                name: "New Board",
                layout: "BOARD",
              };

              await window.electronAPI.addBoard(newBoard);

              await loadBoards();
            }}
          >
            <PlusIcon className="icon fill" />
          </button>
        </div>
      </div>

      {curBoard ? (
        <BoardComponent
          board={curBoard}
          loadedBoard={loadedBoard}
          sounds={sounds}
          playSound={playSound}
          onSetBoard={(id) => {
            window.electronAPI.sendData({
              message: "board_data",
              data: id > 0 ? curBoard : null,
            });

            onSetLoadedBoard(id);
          }}
          onSave={(board) => {
            console.log(loadedBoard, board, curBoard);
            if (loadedBoard && loadedBoard.id === curBoard.id) {
              window.electronAPI.sendData({
                message: "board_data",
                data: board,
              });
            }

            window.electronAPI.updateBoard(board);
            loadBoards();
          }}
          onDelete={(id) => {
            setConfig((prev) => ({ ...prev, deleteId: id }));
          }}
        />
      ) : (
        <span>No Board Selected</span>
      )}
    </>
  );
}
