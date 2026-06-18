import { ipcMain } from "electron";

import { readTags, addTag, updateTag, deleteTag } from "../storage/tags.js";

export function registerTagsHandlers(tagsPath) {
  ipcMain.handle("get-tags", () => {
    return readTags(tagsPath);
  });

  ipcMain.handle("add-tag", (_, tag) => {
    addTag(tagsPath, tag);
  });

  ipcMain.handle("update-tag", (_, partialSettings) => {
    updateTag(tagsPath, partialSettings);
  });

  ipcMain.handle("delete-tag", (_, id) => {
    deleteTag(tagsPath, id);
  });
}
