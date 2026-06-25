import { ipcMain } from "electron";

import {
  readBoards,
  updateBoard,
  deleteBoard,
  addBoard,
} from "../storage/boards.js";

export function registerBoardsHandlers(boardsPath) {
  ipcMain.handle("get-boards", () => {
    return readBoards(boardsPath);
  });

  ipcMain.handle("add-board", (_, board) => {
    const newBoard = addBoard(boardsPath, board);
    return newBoard;
  });

  ipcMain.handle("update-board", (_, partialSettings) => {
    updateBoard(boardsPath, partialSettings);
  });

  ipcMain.handle("delete-board", (_, id) => {
    deleteBoard(boardsPath, id);
  });
}
