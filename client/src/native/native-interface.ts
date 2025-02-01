interface InitWindowResult {
  path: string;
  processId: number;
}

interface WindowNativeModule {
  bringWindowToTop(id: number): void;

  getWindows(): number[];

  initWindow(id: number): InitWindowResult;
}

interface KeyboardNativeModule {

  typeString(string: string): void;

  keyTap(key: string, modifier?: string | string[]): void;

  keyToggle(key: string, down: string, modifier?: string | string[]): void;
}

interface NativeModule extends WindowNativeModule, KeyboardNativeModule {
}

export type {
  InitWindowResult,
  NativeModule,
};
