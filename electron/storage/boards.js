import { readData, writeData } from "../helpers/data.js";

export function readBoards(boardsPath) {
  return readData(boardsPath, []);
}

export function addBoard(boardsPath, board) {
  const boards = readBoards(boardsPath);

  boards.push({ id: Date.now(), ...board });

  writeData(boardsPath, boards);

  return { id: Date.now(), ...board };
}

export function updateBoard(boardsPath, updated) {
  const boards = readBoards(boardsPath);

  const index = boards.findIndex((s) => s.id === updated.id);

  if (index === -1) {
    return null;
  }

  boards[index] = {
    ...boards[index],
    ...updated,
  };

  writeData(boardsPath, boards);
}

export function deleteBoard(boardsPath, id) {
  const boards = readBoards(boardsPath);

  const board = boards.find((s) => s.id === id);

  if (!board) {
    return;
  }

  const updated = boards.filter((s) => s.id !== id);

  writeData(boardsPath, updated);
}
