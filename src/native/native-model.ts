interface HotkeyNativeModule {
  /**
   * Registers a global hotkey
   * @param key - Key name (e.g. 'a', 'escape', 'return', etc)
   * @param modifiers - Array of modifier keys
   * @param callback - Function to call when hotkey is pressed
   * @returns Hotkey ID that can be used to unregister the hotkey
   */
  registerHotkey(key: string, modifiers: ModifierKey[], callback: () => void): number;

  /**
   * Unregisters a previously registered hotkey
   * @param hotkeyId - ID returned from registerHotkey
   */
  unregisterHotkey(hotkeyId: number): void;

  /**
   * Cleans up all registered hotkeys
   */
  cleanupHotkeys(): void;

  /**
   * Sets whether to print statements from C code
   */
  setLoggerLevel(showDebug: boolean): void;

  /**
   * Changes title of a console application
   */
  setWindowTitle(title: string): void;

  // loaded by nodejs
  path: string;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

interface RgbDevice {
  deviceId: number;
  name: string;
  leds: { name: string }[];
  colorCount: number;
}

interface OpenRgbNativeModule {
  rgbConnect(host: string, port: number, clientName: string): Promise<void>;
  rgbGetDevices(): Promise<RgbDevice[]>;
  rgbSetCustomMode(deviceId: number): void;
  rgbUpdateAllLeds(deviceId: number, colors: RgbColor[]): void;
  rgbUpdateSingleLed(deviceId: number, ledId: number, color: RgbColor): void;
  rgbDisconnect(): void;
}

type INativeModule = HotkeyNativeModule & OpenRgbNativeModule

type ModifierKey = 'alt' | 'ctrl' | 'shift' | 'super' | 'win';

export const Native = 'Native';

export type {
  INativeModule,
  OpenRgbNativeModule,
  ModifierKey,
  RgbColor,
  RgbDevice,
};
