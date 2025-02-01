interface InitWindowResult {
  path: string;
  processId: number;
}

interface NativeModule {
  bringWindowToTop(id: number): void;

  getWindows(): number[];

  initWindow(id: number): InitWindowResult;
}

export type {
  InitWindowResult,
  NativeModule,
};
