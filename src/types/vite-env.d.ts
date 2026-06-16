export {};

declare global {
  type ControllerData = {
    message: string;
    data?: unknown;
  };

  type VBCommand = {
    cmd:
      | "get_float"
      | "get_string"
      | "set_float"
      | "set_string"
      | "input_devices"
      | "output_devices";
    param?: string;
    value?: number;
    string_value?: string;
  };

  type VBCommandResponse = {
    success: boolean;
    message: string;
    float_value?: number;
    string_value?: string;
  };

  type VBDetected = {
    voicemeeter: boolean;
    vbCable: boolean;
  };

  type VBDevice = {
    FriendlyName: string;
  };

  type AudioDevice = {
    label: string;
    id: string;
  };

  type VMAudioDevice = {
    id: string;
    name: string;
    driver: "WDM" | "MME";
  };

  type Settings = {
    baseColor: string;
    stopHotkey: Hotkey;
    controllerToggleHotkey: Hotkey;
    defaultInputDevice?: VMAudioDevice;
    defaultOutputDevice?: VMAudioDevice;
    defaultLocalOutputDevice?: string;
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

    icon?: string;
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
      //Window
      showController: () => void;
      hideController: () => void;
      sendSound: (id: number) => void;
      sendData: (data: ControllerData) => void;

      // Files
      getFileUrl: (path: string) => Promise<string>;
      pickAudioFile: () => Promise<string | null>;

      // Sounds
      getSounds: () => Promise<Sound[]>;
      readSound: (path: string) => unknown;
      saveSound: (filePath: string, metadata: object) => void;
      deleteSound: (id: number) => void;
      updateSound: (data: Sound) => void;
      getSoundPath: (name: string) => Promise<string>;
      saveRecording: (buffer: ArrayBuffer, metadata: object) => void;
      saveYoutubeLink: (link: string) => void;

      onPlaySound: (callback: (soundId: string) => void) => void;
      onYoutubeProgress: (callback: (percent: number) => void) => void;
      onMainRecieved: (callback: (data: ControllerData) => void) => void;

      // Settings
      readSettings: () => Settings;
      updateSettings: (data: Partial<Settings>) => void;

      // Hotkeys
      registerHotkey: (hotkey: Hotkey, data: object) => void;
      unregisterHotkeys: () => void;

      // VB Audio
      detectVBAudio: () => Promise<VBDevice[]>;
      disableVBAudio: () => void;
      openVoicemeeter: () => void;
      setVMCommand: (command: VBCommand) => Promise<VBCommandResponse>;
    };
  }
}
