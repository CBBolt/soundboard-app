export {};

declare global {
  type VBDevice = {
    FriendlyName: string;
  };

  type Settings = {
    baseColor: string;
  };

  type Hotkey = {
    key: string; // "a", "1", "space"
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };

  type Sound = {
    id: number;
    name: string;
    fileName: string;
    duration?: number;

    color?: string;
    startTime?: number;
    endTime?: number;
    gain?: number;
    fadeIn?: number;
    fadeOut?: number;

    hotkey?: Hotkey;
  };

  interface Window {
    electronAPI: {
      // Files
      getFileUrl: (path: string) => Promise<string>;
      pickAudioFile: () => Promise<string | null>;

      // Sounds
      getSounds: () => Promise<Sound[]>;
      readSound: (path: string) => unknown;
      saveSound: (filePath: string, metadata: object) => void;
      deleteSound: (id: number) => void;
      renameSound: ({ id: string, newName: string }) => void;
      updateSound: (data: Sound) => void;
      getSoundPath: (name: string) => Promise<string>;
      onPlaySound: (callback: (soundId: string) => void) => void;
      saveRecording: (buffer: ArrayBuffer, metadata: object) => void;

      // Settings
      readSettings: () => Settings;
      updateSettings: (data: Partial<Settings>) => void;

      // Hotkeys
      registerHotkey: (hotkey: Hotkey, soundId: number) => void;
      unregisterHotkeys: () => void;

      // VB Audio
      detectVBAudio: () => Promise<VBDevice[]>;
      disableVBAudio: () => unknown;
    };
  }
}
