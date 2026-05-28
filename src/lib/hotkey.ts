export function matchHotkey(e: KeyboardEvent, hotkey?: Hotkey) {
  if (!hotkey) return false;

  const key = typeof e.key === "string" ? e.key.toLowerCase() : e.key;
  const hotkeyKey =
    typeof hotkey.key === "string" ? hotkey.key.toLowerCase() : hotkey.key;

  return (
    key === hotkeyKey &&
    !!e.ctrlKey === !!hotkey.ctrl &&
    !!e.shiftKey === !!hotkey.shift &&
    !!e.altKey === !!hotkey.alt &&
    !!e.metaKey === !!hotkey.meta
  );
}

export function formatHotkey(h?: Hotkey) {
  if (!h) return "";

  const parts = [];

  if (h.ctrl) parts.push("Ctrl");
  if (h.shift) parts.push("Shift");
  if (h.alt) parts.push("Alt");
  if (h.meta) parts.push("Cmd");

  const key = typeof h.key === "string" ? h.key.toUpperCase() : h.key;

  parts.push(key);

  return parts.join(" + ");
}

export function formatHotkeyParts(h?: Hotkey) {
  if (!h) return [];

  const parts = [];

  if (h.ctrl) parts.push("Ctrl");
  if (h.shift) parts.push("Shift");
  if (h.alt) parts.push("Alt");
  if (h.meta) parts.push("Cmd");

  const key = typeof h.key === "string" ? h.key.toUpperCase() : h.key;

  parts.push(key);

  return parts;
}

export function hotkeysEqual(a: Hotkey, b: Hotkey) {
  return (
    a.key === b.key &&
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    a.meta === b.meta
  );
}
