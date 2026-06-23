import { useEffect, useState } from "react";

import BoardComponent from "./BoardComponent";
import PlusIcon from "../../icons/PlusIcon";
// import BoardScroller from "./BoardScroller";
import Modal from "../Modal/Modal";
import TrashIcon from "../../icons/TrashIcon";
import Carousel from "../Carousel/Carousel";

type BoardProps = {
  boards: Board[];
  sounds: Sound[];
  playSound: (sound: Sound) => void;
  loadBoards: () => void;
};

type BoardConfig = {
  loadedBoardId: number;
  curBoardId: number;
  deleteId: number;
};

export default function BoardManager({
  boards,
  sounds,
  playSound,
  loadBoards,
}: BoardProps) {
  const [config, setConfig] = useState<BoardConfig>({
    loadedBoardId: 0,
    curBoardId: -1,
    deleteId: 0,
  });

  const curBoard = boards.find((b) => b.id === config.curBoardId);

  useEffect(() => {
    if (boards.length > 0 && !boards.some((b) => b.id === config.curBoardId)) {
      setConfig((prev) => ({
        ...prev,
        curBoardId: boards[0].id,
        loadedBoardId: boards[0].id,
      }));

      window.electronAPI.sendData({
        message: "board_data",
        data: curBoard,
      });
    }
  }, [boards, config.curBoardId]);

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
      <div className="flex-gap">
        <Carousel
          items={boards}
          curItemId={config.curBoardId}
          onSelect={(id) => setConfig((prev) => ({ ...prev, curBoardId: id }))}
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
        {config.loadedBoardId && (
          <span>{`Loaded Board: ${boards.find((b) => b.id === config.curBoardId)!.name}`}</span>
        )}
      </div>

      {curBoard ? (
        <BoardComponent
          board={curBoard}
          sounds={sounds}
          playSound={playSound}
          onSetBoard={(id) => {
            window.electronAPI.sendData({
              message: "board_data",
              data: curBoard,
            });

            setConfig((prev) => ({ ...prev, loadedBoardId: id }));
          }}
          onSave={(board) => {
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
