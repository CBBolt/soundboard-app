import { useEffect, useState } from "react";
import { useEventBus } from "../../contexts/GlobalEventContext";

import BoardComponent from "./BoardComponent";
import Modal from "../Modal/Modal";
import Carousel from "../Carousel/Carousel";

import PlusIcon from "../../icons/PlusIcon";
import TrashIcon from "../../icons/TrashIcon";
import LoadIcon from "../../icons/LoadIcon";
import Marquee from "../Marquee/Marquee";
import SoundboardIcon from "../../icons/SoundboardIcon";

type BoardProps = {
  boards: Board[];
  sounds: Sound[];
  allTags: Tag[];
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
  allTags,
  playSound,
  loadBoards,
  loadedBoard,
  onSetLoadedBoard,
}: BoardProps) {
  const bus = useEventBus();
  const [config, setConfig] = useState<BoardConfig>({
    curBoardId: -1,
    deleteId: 0,
  });

  const curBoard = boards.find((b) => b.id === config.curBoardId);

  useEffect(() => {
    if (!boards.length) return;

    setConfig((prev) => {
      if (boards.some((b) => b.id === prev.curBoardId)) {
        return prev;
      }

      if (loadedBoard && boards.some((b) => b.id === loadedBoard.id)) {
        return {
          ...prev,
          curBoardId: loadedBoard.id,
        };
      }

      return {
        ...prev,
        curBoardId: boards[0].id,
      };
    });
  }, [boards, loadedBoard]);

  return (
    <div
      className="flex-gap"
      style={{ flexDirection: "column", flex: "1", height: "100%" }}
      data-tour="boards-section"
      tour-cond={boards.length}
    >
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

            bus.emit("new-notification", {
              status: "INFO",
              message: "Board Deleted!",
            });

            loadBoards();
          }}
        >
          Confirm
        </button>
      </Modal>
      <div className="grid-gap" style={{ width: "100%" }}>
        <div className="flex-gap" style={{ justifyContent: "center" }}>
          {loadedBoard && (
            <div
              className="flex-gap"
              style={{
                border: "2px solid white",
                padding: 5,
                borderRadius: 5,
                width: "25%",
              }}
            >
              <LoadIcon className="icon fill stroke" />
              <Marquee text={loadedBoard.name} />
            </div>
          )}
          <div
            className="panel"
            style={{ fontSize: "smaller", marginTop: "-10px" }}
          >
            Note: Make sure board is saved before loading to controller <br />
            Note: Controller overlay works best with apps in windowed mode
          </div>
        </div>
        <div className="flex-gap">
          <Carousel
            items={boards}
            curItemId={config.curBoardId}
            onSelect={(id) =>
              setConfig((prev) => ({ ...prev, curBoardId: id }))
            }
          />
          <button
            data-tour="add-board"
            onClick={async () => {
              const newBoard: Partial<Board> = {
                name: "New Board",
                layout: "BOARD",
              };

              bus.emit("new-notification", {
                status: "INFO",
                message: "Board Added!",
              });

              const addBoard = await window.electronAPI.addBoard(newBoard);

              setConfig((prev) => ({ ...prev, curBoardId: addBoard.id }));

              await loadBoards();
            }}
          >
            <PlusIcon className="icon fill" />
          </button>
        </div>
      </div>

      {boards.length > 0 ? (
        <>
          {curBoard ? (
            <BoardComponent
              board={curBoard}
              loadedBoard={loadedBoard}
              sounds={sounds}
              allTags={allTags}
              playSound={playSound}
              onSetBoard={(id) => {
                window.electronAPI.sendData({
                  message: "board_data",
                  data: id > 0 ? curBoard : null,
                });

                bus.emit("new-notification", {
                  status: "INFO",
                  message: id > 0 ? "Board Loaded!" : "Board Unloaded!",
                });

                onSetLoadedBoard(id);
              }}
              onSave={(board) => {
                if (loadedBoard && loadedBoard.id === curBoard.id) {
                  window.electronAPI.sendData({
                    message: "board_data",
                    data: board,
                  });
                }

                bus.emit("new-notification", {
                  status: "INFO",
                  message: "Board Updated!",
                });

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
      ) : (
        <div className="flex-gap" style={{ margin: "auto" }}>
          <SoundboardIcon className="icon stroke" />
          No Boards
        </div>
      )}
    </div>
  );
}
