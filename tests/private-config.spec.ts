import type {TestingModule} from '@nestjs/testing';
import {Test} from '@nestjs/testing';
import {Logger} from '@nestjs/common';
import {ConfigService} from '../src/config/config-service';
import {ConfigReaderService} from '../src/config/config-reader-service';
import {ShortcutProcessingService} from '../src/local/shortcut-processing.service';
import {ClientService} from '../src/client/client-service';
import type {AppService} from '../src/client/services/app.service';
import type {KeyboardService} from '../src/client/services/keyboard.service';
import type {MonitorService} from '../src/client/services/monitor.service';
import type {MouseService} from '../src/client/services/mouse.service';
import type {ProcessService} from '../src/client/services/process.service';
import type {WindowService} from '../src/client/services/window.service';
import {VariableResolutionService} from '../src/local/variable-resolution.service';
import {CommandLocalHandler} from '../src/local/command-local-handler';
import {DelayService} from '../src/local/delay.service';
import {RgbService} from '../src/rgb/rgb-service';
import {EvaluateService} from '../src/local/evaluate-serivce';
import {ReloadLocalHandler} from '../src/local/implementation/reload-local-handler';
import {remoteHandlerProviders} from '../src/remote/remote-handler-module';
import {localProviders} from '../src/local/local.module';
import {getInfoProviders} from '../src/get-info/get-info-module';
import {AsyncStorageModule} from '../src/asyncstore/async-storage.module';
import {RandomModule} from '../src/random/random.module';
import {SemaphorModule} from '../src/semaphor/semaphor.module';
import {ConfigPathClass, ENV} from '../src/config/types/config-path';
import {SAVE_TIMEOUT} from '../src/config/config-model';
import type {KeyState, RgbServiceI} from '../src/rgb/rgb-model';
import type {Shortcut} from '../src/config/types/shortcut';
import {INativeModule, Native} from '../src/native/native-model';
import {parse} from 'jsonc-parser';
import path from 'path';
import {readFile,readdir, access} from 'fs/promises';


const globalEnv = {};
const configDir = path.join(__dirname, '..', 'examples', 'config');
const variablesFilePath = path.join(__dirname, '..', 'examples', 'variables-example.jsonc');

// Mock setTimeout to speed up tests
const originalSetTimeout = global.setTimeout;
global.setTimeout = jest.fn((callback, delay) => {
  return originalSetTimeout(callback, 1); // Always use 1ms delay
}) as any;

const rgbStub: RgbServiceI = new class {
  public updateColor(_comb: string, _hl: KeyState): void {}
  public async setup(): Promise<boolean> { return false; }
};

const nativeStub: INativeModule = {
  registerHotkey: jest.fn().mockReturnValue(1),
  unregisterHotkey: jest.fn(),
  cleanupHotkeys: jest.fn(),
  setLoggerLevel: jest.fn(),
  setWindowTitle: jest.fn(),
  rgbConnect: jest.fn(),
  rgbGetDevices: jest.fn(),
  rgbSetCustomMode: jest.fn(),
  rgbUpdateAllLeds: jest.fn(),
  rgbUpdateSingleLed: jest.fn(),
  rgbDisconnect: jest.fn(),
  rgbRegisterDCEvent: jest.fn(),
  path: 'mock',
};

const appStub: MockService<AppService> = {
  ping: jest.fn().mockResolvedValue({status: 'ok', version: '1.0.0'}),
  client: undefined as any
};

const keyboardStub: MockService<KeyboardService> = {
  keyPress: jest.fn().mockResolvedValue(undefined),
  typeText: jest.fn().mockResolvedValue(undefined),
  setLayout: jest.fn().mockResolvedValue(undefined),
  client: undefined as any
};

const monitorStub: MockService<MonitorService> = {
  getMonitors: jest.fn().mockResolvedValue([1, 2]),
  getMonitorInfo: jest.fn().mockResolvedValue({
    bounds: {x: 0, y: 0, width: 1920, height: 1080},
    workArea: {x: 0, y: 0, width: 1920, height: 1040},
    scale: 1.0,
    isPrimary: true
  }),
  client: undefined as any
};

const mouseStub: MockService<MouseService> = {
  getPosition: jest.fn().mockResolvedValue({x: 100, y: 200}),
  moveLeftClick: jest.fn().mockResolvedValue(undefined),
  setMousePosition: jest.fn().mockResolvedValue(undefined),
  mouseMoveHuman: jest.fn().mockResolvedValue(undefined),
  click: jest.fn().mockResolvedValue(undefined),
  client: undefined as any
};

type MockService<T> = jest.Mocked<Omit<T, 'client'>> & { readonly client: any };

const processStub: MockService<ProcessService> = {
  getProcessInfo: jest.fn().mockResolvedValue({
    pid: 1234,
    parentPid: 5678,
    path: 'C:\\Windows\\System32\\notepad.exe',
    isElevated: false,
    threadCount: 4,
    memory: {
      workingSetSize: 1024000,
      peakWorkingSetSize: 2048000,
      privateUsage: 512000,
      pageFileUsage: 256000
    },
    times: {
      creationTime: 130000000000000000,
      kernelTime: 100000000,
      userTime: 200000000
    },
    wids: [12345]
  }),
  killExeByPid: jest.fn().mockResolvedValue(undefined),
  findPidByName: jest.fn().mockResolvedValue([1234, 5678]),
  createProcess: jest.fn().mockResolvedValue({pid: 9999}),
  killExeByName: jest.fn().mockResolvedValue(undefined),
  client: undefined as any
};

const windowStub: MockService<WindowService> = {
  getWindowInfo: jest.fn().mockResolvedValue({
    bounds: {x: 100, y: 100, width: 800, height: 600},
    wid: 12345,
    pid: 1234,
    path: 'C:\\Windows\\System32\\notepad.exe',
    parentWid: 0,
    opacity: 1.0,
    title: 'Notepad'
  }),
  setWindowProperties: jest.fn().mockResolvedValue(undefined),
  getActiveWindowInfo: jest.fn().mockResolvedValue({
    bounds: {x: 100, y: 100, width: 800, height: 600},
    wid: 12345,
    pid: 1234,
    path: 'C:\\Windows\\System32\\notepad.exe',
    parentWid: 0,
    opacity: 1.0,
    title: 'Notepad'
  }),
  setWindowActive: jest.fn().mockResolvedValue(undefined),
  client: undefined as any
};

const clientMock = {
  app: appStub,
  keyboard: keyboardStub,
  monitor: monitorStub,
  mouse: mouseStub,
  process: processStub,
  window: windowStub
} as unknown as jest.Mocked<ClientService>;

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  const testModule = await Test.createTestingModule({
    imports: [AsyncStorageModule, RandomModule, SemaphorModule],
    providers: [
      ...remoteHandlerProviders,
      ...localProviders,
      ...getInfoProviders,
      ShortcutProcessingService,
      EvaluateService,
      DelayService,
      VariableResolutionService,
      CommandLocalHandler,
      {provide: SAVE_TIMEOUT, useValue: -1},
      {provide: RgbService, useValue: rgbStub},
      {provide: Native, useValue: nativeStub},
      {provide: ClientService, useValue: clientMock},
      {
        provide: ConfigPathClass,
        useValue: {
          configFilePath,
          variablesFilePath,
          macroFilePath: null!,
          setConfigPaths(_config?: string, _macro?: string, _variable?: string) {},
        },
      },
      ConfigService,
      ConfigReaderService,
      {provide: ENV, useValue: globalEnv},
      Logger,
    ],
  }).compile();
  testModule.get<ReloadLocalHandler>(ReloadLocalHandler).setKeyBindingService({} as any);
  return testModule;
}

async function readCombinations(filePath: string): Promise<Array<{name?: string; shortCut?: string}>> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const config = parse(content) as {combinations?: Array<{name?: string; shortCut?: string}>};
    return config?.combinations ?? [];
  } catch {
    return [];
  }
}


async function directoryExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('Private config files', async () => {
  const files = await directoryExists(configDir) ? (await readdir(configDir)).filter(f => f.endsWith('.jsonc')) : [];
  if (files.length === 0) {
    it.skip('no config files found', () => {});
  }

  for (const file of files) {
    describe(file, () => {

      describe('shortcuts', async () => {
        const combinations = await readCombinations(path.join(configDir, file));

        if (combinations.length === 0) {
          it.skip('no shortcuts', () => {});
        }

        let testModule: TestingModule = await getTestModule(path.join(configDir, file));
        await testModule.get<ConfigService>(ConfigService).parseConfig();

        for (const combo of combinations) {
          const label = [combo.shortCut, combo.name].filter(Boolean).join(': ');
          test.concurrent(label, async () => {

            const service = testModule.get<ConfigService>(ConfigService);
            const shortcutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
            const shortcut = service.getCombinations().find((s: Shortcut) => s.shortCut === combo.shortCut);
            if (shortcut) {
              await shortcutService.runShortcut(shortcut);
            }
          });
        }
      });
    });
  }
});
