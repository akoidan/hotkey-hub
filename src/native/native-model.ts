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

  // loaded by nodejs
  path: string;
}

type INativeModule = HotkeyNativeModule

type ModifierKey = 'alt' | 'ctrl' | 'shift' | 'super' | 'win';

export const Native = 'Native';

export type {
  INativeModule,
  ModifierKey,
};
