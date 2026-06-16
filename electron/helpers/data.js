import fs from "fs";

export function readData(filePath, defaultValue) {
  if (!filePath) {
    console.warn("No filePath provided for readData");
    return;
  }

  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Merge objects like settings
    if (
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue)
    ) {
      return {
        ...defaultValue,
        ...data,
      };
    }

    return data;
  } catch (err) {
    console.error(`Failed reading ${filePath}:`, err);

    return defaultValue;
  }
}

export function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
