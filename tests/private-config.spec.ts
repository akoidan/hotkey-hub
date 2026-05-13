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
import {INativeModule, Native} from '../src/native/native-model';
import {parse} from 'jsonc-parser';
import path from 'path';
import fs from 'fs';
import {BehaviourEnum, BehaviourObject} from '@/config/types/shortcut';
import {SET_TIMEOUT_TOKEN} from '@/local/local-model';


if (process.env.RUN_PRIVATE_TEST) {

  const globalEnv = {};
  const configDir = path.join(__dirname, '..', 'examples', 'config');
  const variablesFilePath = path.join(__dirname, '..', 'examples', 'variables-example.jsonc');


  const rgbStub: RgbServiceI = new class {
    public updateColor(_comb: string, _hl: KeyState): void {
    }

    public async setup(): Promise<boolean> {
      return false;
    }
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
        {provide: SET_TIMEOUT_TOKEN, useValue: (cb: any, originTimeout: number) => {
            setTimeout(cb, 0);
          }},
        {provide: RgbService, useValue: rgbStub},
        {provide: Native, useValue: nativeStub},
        {provide: ClientService, useValue: clientMock},
        {
          provide: ConfigPathClass,
          useValue: {
            configFilePath,
            variablesFilePath,
            macroFilePath: null!,
            setConfigPaths(_config?: string, _macro?: string, _variable?: string) {
            },
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


  function readCombinations(filePath: string): Array<{ name?: string; shortCut?: string }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = parse(content) as { combinations?: Array<{ name?: string; shortCut?: string }> };
    return config?.combinations ?? [];
  }

// jest requires describe and all test cases to be described synchronously from the top level
// no async code is allowed, the only exception with es2022 top level await, which jest doesnt support
// all described only accept sync code (no promise) and it(async () => {}) should be defined from top syncrhonously


  function hasCondition(obj: unknown, predicate: (obj: unknown) => boolean): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    if (Array.isArray(obj)) {
      return obj.some(item => hasCondition(item, predicate));
    }

    // Check current object for "loop": -1
    if (predicate(obj)) {
      return true;
    }

    // Recursively check all nested objects
    return Object.values(obj).some(value => hasCondition(value, predicate));
  }

  describe('Private config files', () => {
    const files = fs.existsSync(configDir) ? fs.readdirSync(configDir).filter(f => f.endsWith('.jsonc')) : [];
    if (files.length === 0) {
      /// loop on bot would not run and tests would fail w/o it
      it.skip('no config files found', () => {
        void 0;
      });
    }

    for (const file of files) {
      if (file === 'login-all.jsonc') { // to complex should be tested separately
        continue;
      }
      describe(file, (): void => {


        // console.log('work 1')
        // beforeAll(async () => {
        //   console.log('work 2')
        //
        // })


        const combinations = readCombinations(path.join(configDir, file));
        if (combinations.length === 0) {
          it.skip('no shortcuts', () => {
          });
        }
        for (let i = 0; i < combinations.length; i++) {
          test.concurrent(`#${i} ${combinations[i].shortCut} => ${combinations[i].name}`, async () => {
            let testModule: TestingModule;
            testModule = await getTestModule(path.join(configDir, file));
            await testModule.get<ConfigService>(ConfigService).parseConfig();
            const service = testModule.get<ConfigService>(ConfigService);
            const shortcutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
            const shortcut = (service.getCombinations())[i];
            if (hasCondition(shortcut, (obj: any) => ('loop' in obj && obj.loop === -1))) {
              const isPausable = shortcut.behaviour === BehaviourEnum.pausable
                || (shortcut?.behaviour as BehaviourObject)?.type === BehaviourEnum.pausable;
              if (!isPausable) {
                fail(`shortcut with infinitive loop is not pausable`);
              }
              ;
              let promiseResolve;
              setTimeout(() => {
                promiseResolve = shortcutService.runShortcut(shortcut);
              }, 100);
              await Promise.all([shortcutService.runShortcut(shortcut), promiseResolve]);
            } else {
              await shortcutService.runShortcut(shortcut);
            }
          });
        }
      })
    }
  });
} else {
  describe('skip', () => {
    it.skip('sd', () =>{});
  })
}