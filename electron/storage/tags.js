import { readData, writeData } from "../helpers/data.js";

export function readTags(tagsPath) {
  return readData(tagsPath, []);
}

export function addTag(tagsPath, tag) {
  const tags = readTags(tagsPath);

  tags.push({ id: Date.now(), ...tag });

  writeData(tagsPath, tags);
}

export function updateTag(tagsPath, updated) {
  const tags = readTags(tagsPath);

  const index = tags.findIndex((s) => s.id === updated.id);

  if (index === -1) {
    return null;
  }

  tags[index] = {
    ...tags[index],
    ...updated,
  };

  writeData(tagsPath, tags);
}

export function deleteTag(tagsPath, id) {
  const tags = readTags(tagsPath);

  const tag = tags.find((s) => s.id === id);

  if (!tag) {
    return;
  }

  const updated = tags.filter((s) => s.id !== id);

  writeData(tagsPath, updated);
}
