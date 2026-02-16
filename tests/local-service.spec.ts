import type {TestingModule,} from '@nestjs/testing';
import {Test,} from '@nestjs/testing';
import {ShortcutProcessingService} from '../src/local/shortcut-processing.service';
import {ClientService} from '../src/client/client-service';
import {Logger} from '@nestjs/common';
import {ConfigService} from '../src/config/config-service';
import {ConfigReaderService} from '../src/config/config-reader-service';
import {remoteHandlerProviders} from '../src/remote/remote-handler-module';
import {VariableResolutionService} from '../src/local/variable-resolution.service';
import {CommandLocalHandler} from '../src/local/command-local-handler';
import path from 'path';
import {AsyncStorageModule} from '../src/asyncstore/async-storage.module';
import {RandomModule} from '../src/random/random.module';
import {SemaphorModule} from '../src/semaphor/semaphor.module';
import {DelayService} from '../src/local/delay.service';
import {localProviders} from '../src/local/local.module';
import {RgbService} from '../src/rgb/rgb-service';
import {RgbServiceI} from '../src/rgb/rgb-model';
import {ConfigPathClass, ENV} from '../src/config/types/config-path';
import process from 'node:process';
import {ReloadLocalHandler} from '../src/local/implementation/reload-local-handler';
import {EvaluateService} from '../src/local/evaluate-serivce';
import {getInfoProviders} from '../src/get-info/get-info-module';
import {SAVE_TIMEOUT} from "../src/config/config-model";

const globalEnv = {};

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  const rgbStub: RgbServiceI = new class {
    public async updateColors(comb: string, hl: boolean): Promise<void> {
    }

    public async setup(): Promise<void> {
    }
  }
  const testModule = await Test.createTestingModule({
    imports: [AsyncStorageModule, RandomModule, SemaphorModule],
    providers: [
      ...remoteHandlerProviders,
      ...localProviders,
      ...getInfoProviders,
      ShortcutProcessingService,
      EvaluateService,
      DelayService,
      {
        provide: SAVE_TIMEOUT,
        useValue: -1, // do not save config at at
      },
      {
        provide: RgbService,
        useValue: rgbStub
      },
      VariableResolutionService,
      CommandLocalHandler,
      {
        provide: ClientService,
        useValue: {
          keyboard: { typeText: jest.fn(), keyPress: jest.fn() },
          mouse: { mouseMoveHuman: jest.fn(), leftMouseClick: jest.fn(), mouseMoveLeftClick: jest.fn() },
          window: { focusWindow: jest.fn(), setWindowBounds: jest.fn(), getActiveWindowId: jest.fn() },
          process: { launchExe: jest.fn(), killExeByName: jest.fn(), killExeById: jest.fn(), findPidsByName: jest.fn() },
          monitor: { getMonitors: jest.fn(), monitorInfo: jest.fn(), getMonitorScaleFactor: jest.fn() },
          app: { ping: jest.fn() }
        },
      },
      {
        provide: ConfigPathClass,
        useValue: {
          configFilePath: path.join(__dirname, 'fixtures', configFilePath),
          variablesFilePath: path.join(__dirname, 'fixtures', 'variables.jsonc'),
          macroFilePath: null!,
          setConfigPaths(config?: string, macro?: string, variable?: string) {
          }
        }
      },
      ConfigService,
      ConfigReaderService,
      {
        provide: ENV,
        useValue: globalEnv,
      },
      Logger,
    ],
  }).compile();
  const a = testModule.get<ReloadLocalHandler>(ReloadLocalHandler);
  a.setKeyBindingService({} as any);
  return testModule;
}

describe('Logic service', () => {
  it('should execute key press remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    (clientService.keyboard.keyPress as jest.Mock).mockImplementation(() => Promise.resolve());
    const spyKeyPress = jest.spyOn(clientService.keyboard, 'keyPress');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'keyPress',
          variables: {
            key: 'a',
            holdKeys: ['shift'],
            duration: 100
          }
        },
      ],
      name: 'Key press test',
      shortCut: 'Alt+K',
    });

    expect(spyKeyPress).toHaveBeenCalledWith('this', {
      keys: ['a'],
      holdKeys: ['shift'],
      duration: 100
    });
  });

  it('should execute mouse click remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.mouse.mouseMoveHuman = jest.fn().mockImplementation();
    const spyMouseClick = jest.spyOn(clientService.mouse, 'mouseMoveHuman');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'mouseMoveLeftClick',
          variables: {
            x: 100,
            y: 200,
            pixelsPerIteration: 20,
          },
        },
      ],
      name: 'Mouse click test',
      shortCut: 'Alt+M',
    });

    expect(spyMouseClick).toHaveBeenCalledWith('this', {
      pixelsPerIteration: 20,
      x: 100,
      y: 200
    });
  });

  it('should execute find pids by name remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.process.findPidByName = jest.fn().mockImplementation();
    const spyFindPids = jest.spyOn(clientService.process, 'findPidByName');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getPidsByName',
          assignVariable: 'pid',
          variables: {
            name: 'notepad.exe'
          },
        },
      ],
      name: 'Find pids test',
      shortCut: 'Alt+F',
    });

    expect(spyFindPids).toHaveBeenCalledWith('this', 'notepad.exe');
  });

  it('should execute kill process by name remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.process.killExeByName = jest.fn().mockImplementation();
    const spyKillProcess = jest.spyOn(clientService.process, 'killExeByName');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'killExeByName',
          variables: {
            name: 'notepad.exe'
          },
        },
      ],
      name: 'Kill process test',
      shortCut: 'Alt+K',
    });

    expect(spyKillProcess).toHaveBeenCalledWith('this', 'notepad.exe');
  });

  it('should execute find process windows remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.process.getProcessInfo = jest.fn().mockImplementation(() => ({wids: ['123', '456']}));
    const spyGetWindows = jest.spyOn(clientService.process, 'getProcessInfo');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getWindowsIdByPid',
          variables: {
            pid: 789,
          },
          assignVariable: 'windowIds',
        },
      ],
      name: 'Find process windows test',
      shortCut: 'Alt+W',
    });

    expect(spyGetWindows).toHaveBeenCalledWith('this', 789);
  });

  it('should execute find processes windows remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.process.getProcessInfo = jest.fn()
        .mockImplementationOnce(() => ({wids: [123, 456]}))
        .mockImplementationOnce(() => ({wids: [1235, 124]}));
    const spyGetWindows = jest.spyOn(clientService.process, 'getProcessInfo');
    await tyrs.parseConfig();

    delete tyrs.getVariables()['window1'];
    delete tyrs.getVariables()['window2'];
    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getWindowsIdByMultiplePids',
          variables: {
            pids: [789, 101]
          },
          assignVariable: ['window1', 'window2'],
        },
      ],
      name: 'Find processes windows test',
      shortCut: 'Alt+W',
    });

    expect(spyGetWindows).toHaveBeenCalledWith('this', 789);
    expect(spyGetWindows).toHaveBeenCalledWith('this', 101);
    expect(spyGetWindows).toHaveBeenCalledTimes(2);
    expect(tyrs.getVariables()).toHaveProperty('window1', [123, 456]);
    expect(tyrs.getVariables()).toHaveProperty('window2', [1235, 124]);
  });

  it('should execute focus window remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.window.setWindowActive = jest.fn().mockImplementation();
    const spyFocusWindow = jest.spyOn(clientService.window, 'setWindowActive');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'focusWindow',
          variables: {
            wid: 789
          },
        },
      ],
      name: 'Focus window test',
      shortCut: 'Alt+F',
    });

    expect(spyFocusWindow).toHaveBeenCalledWith('this', 789);
  });

  it('should execute type text remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyboard.typeText = jest.fn().mockImplementation();
    const spyTypeText = jest.spyOn(clientService.keyboard, 'typeText');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'typeText',
          variables: {
            text: 'Hello World'
          },
        },
      ],
      name: 'Type text test',
      shortCut: 'Alt+T',
    });

    expect(spyTypeText).toHaveBeenCalledWith('this', {
      text: 'Hello World'
    });
  });

  it('Loop', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyboard.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService.keyboard, 'keyPress');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          loop: 3,
          commands: [
            {
              performOnRemote: 'keyPress',
              variables: {
                key: 'a',
              },
              destination: 'that'
            }
          ]
        },
      ],
      delayAfter: 0,
      delayBefore: 200,
      name: 'Tyrs attack each other',
      shortCut: 'Alt+2'
    })
    expect(spykeyPress).toHaveBeenCalledWith('that', {holdKeys: [], keys: ['a']});
    expect(spykeyPress).toHaveBeenCalledTimes(3);
  });


  it('thread', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.mouse.click = jest.fn().mockImplementation();
    clientService.mouse.mouseMoveHuman = jest.fn().mockImplementation();
    const skyMouseMoveClick = jest.spyOn(clientService.mouse, 'mouseMoveHuman');
    const skyMouseClick = jest.spyOn(clientService.mouse, 'click');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          threads: [
            {
              name: 't1',
              commands: [
                {
                  performOnRemote: 'mouseMoveLeftClick',
                  variables: {
                    x: 537,
                    y: 123,
                  },
                  destination: 'that'
                }
              ]
            },
            {
              name: 't2',
              commands: [
                {
                  performOnRemote: 'leftMouseClick',
                  destination: 'that'
                }
              ]
            }
          ]
        }
      ],
      delayAfter: 0,
      delayBefore: 200,
      name: 'Tyrs attack each other',
      shortCut: 'Alt+2'
    })
    expect(skyMouseMoveClick).toHaveBeenCalledWith('that', {x: 537, y: 123});
    expect(skyMouseClick).toHaveBeenCalledWith('that', {'button': 'LEFT'});
  });


  it('should keyPress client call', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyboard.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService.keyboard, 'keyPress');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'keyPress',
          variables: {
            key: 'f6',
          },
        },
      ],
      name: 'test1',
      shortCut: 'Alt+c',
    });
    expect(spykeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['f6']});
  });

  it('should launch exe client call', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.process.createProcess = jest.fn().mockImplementation();
    const spyLaucnhExe = jest.spyOn(clientService.process, 'createProcess');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'launchExe',
          variables: {
            arguments: ['/s', '/t', '0'],
            path: 'C:\\Windows\\System32\\shutdown.exe',
            waitTimeout: 1000,
          },
        },
      ],
      name: 'Launch exe test',
      shortCut: 'Alt+F11',
    });

    expect(spyLaucnhExe).toHaveBeenCalledWith('this', {
      arguments: ['/s', '/t', '0'],
      waitTimeout: 1000,
      path: 'C:\\Windows\\System32\\shutdown.exe'
    }, {timeout: 2000});
  });

  it('should call macro exe client call', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.process.killExeByPid = jest.fn().mockImplementation();
    const spyLaucnhExe = jest.spyOn(clientService.process, 'killExeByPid');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'killExeByPid',
          variables: {
            pid: 123,
          }
        },
      ],
      name: 'Launch exe test',
      shortCut: 'Alt+F11',
    });
    expect(spyLaucnhExe).toHaveBeenCalledWith('this', 123);
  });


  it('should resolve variables in commands', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);

    clientService.keyboard.typeText = jest.fn().mockImplementation();
    const spyTypeText = jest.spyOn(clientService.keyboard, 'typeText');

    // Set up environment variable
    (globalEnv as any)['login'] = 'testuser123';

    await configService.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'typeText',
          variables: {
            text: {
              $ref: 'login'
            }
          },
        },
      ],
      name: 'variable-test',
      shortCut: 'Alt+2',
    });

    expect(spyTypeText).toHaveBeenCalledWith('this', {text: 'testuser123'});

    // Clean up
    delete process.env.login;
  });

  it('should handle complex macro with delays', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyboard.typeText = jest.fn().mockImplementation();
    clientService.keyboard.keyPress = jest.fn().mockImplementation();
    const spyTypeText = jest.spyOn(clientService.keyboard, 'typeText');
    const spyKeyPress = jest.spyOn(clientService.keyboard, 'keyPress');

    await configService.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          macro: 'typeLoginPassword',
          variables: {
            destination: 'this',
            login: 'testuser',
            delayAfter: 200
          }
        }
      ],
      name: 'macro-delay-test',
      shortCut: 'Alt+3',
    });

    expect(spyTypeText).toHaveBeenCalledWith('this', {text: 'testuser', keyDelay: 100, keyDelayDeviation: 0.1,});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['tab']});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['enter']});
  });

  it('should execute get active window command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.window.getActiveWindowInfo = jest.fn().mockImplementation();
    const spyGetActiveWindow = jest.spyOn(clientService.window, 'getActiveWindowInfo');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getActiveWindow',
          assignVariable: 'activeWindow',
        },
      ],
      name: 'Get active window test',
      shortCut: 'Alt+A',
    });

    expect(spyGetActiveWindow).toHaveBeenCalledWith('this');
    expect(tyrs.getVariables()).toHaveProperty('activeWindow');
  });

  it('should execute get monitors command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.monitor.getMonitors = jest.fn().mockImplementation();
    const spyGetMonitors = jest.spyOn(clientService.monitor, 'getMonitors');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getMonitors',
          assignVariable: 'monitors',
        },
      ],
      name: 'Get monitors test',
      shortCut: 'Alt+M',
    });

    expect(spyGetMonitors).toHaveBeenCalledWith('this');
    expect(tyrs.getVariables()).toHaveProperty('monitors');
  });

  it('should execute get monitor info command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.monitor.getMonitorInfo = jest.fn().mockImplementation();
    const spyGetMonitorInfo = jest.spyOn(clientService.monitor, 'getMonitorInfo');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getMonitorInfo',
          assignVariable: 'monitorInfo',
          variables: {
            mid: 0
          },
        },
      ],
      name: 'Get monitor info test',
      shortCut: 'Alt+I',
    });

    expect(spyGetMonitorInfo).toHaveBeenCalledWith('this', 0);
    expect(tyrs.getVariables()).toHaveProperty('monitorInfo');
  });

  it('should execute get window command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.window.getWindowInfo = jest.fn().mockImplementation();
    const spyGetWindow = jest.spyOn(clientService.window, 'getWindowInfo');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getWindow',
          assignVariable: 'windowInfo',
          variables: {
            wid: 123456
          },
        },
      ],
      name: 'Get window test',
      shortCut: 'Alt+W',
    });

    expect(spyGetWindow).toHaveBeenCalledWith('this', 123456);
    expect(tyrs.getVariables()).toHaveProperty('windowInfo');
  });

  it('should execute ping command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.app.ping = jest.fn().mockImplementation();
    const spyPing = jest.spyOn(clientService.app, 'ping');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'ping',
          assignVariable: 'pingResult',
        },
      ],
      name: 'Ping test',
      shortCut: 'Alt+P',
    });

    expect(spyPing).toHaveBeenCalledWith('this');
    expect(tyrs.getVariables()).toHaveProperty('pingResult');
  });

  it('should execute mouse move remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.mouse.mouseMoveHuman = jest.fn().mockImplementation();
    const spyMouseMove = jest.spyOn(clientService.mouse, 'mouseMoveHuman');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'mouseMove',
          variables: {
            x: 300,
            y: 400,
            pixelsPerIteration: 15,
          },
        },
      ],
      name: 'Mouse move test',
      shortCut: 'Alt+V',
    });

    expect(spyMouseMove).toHaveBeenCalledWith('this', {
      x: 300,
      y: 400,
      pixelsPerIteration: 15
    });
  });

  it('should execute set keyboard layout remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyboard.setLayout = jest.fn().mockImplementation();
    const spySetLayout = jest.spyOn(clientService.keyboard, 'setLayout');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'setKeyboardLayout',
          variables: {
            layout: 'us'
          },
        },
      ],
      name: 'Set keyboard layout test',
      shortCut: 'Alt+L',
    });

    expect(spySetLayout).toHaveBeenCalledWith('this', {
      layout: 'us'
    });
  });

  it('should execute set window bounds remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.window.setWindowProperties = jest.fn().mockImplementation();
    const spySetWindowBounds = jest.spyOn(clientService.window, 'setWindowProperties');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'setWindowBounds',
          variables: {
            wid: 123456,
            bounds: {
              x: 100,
              y: 200,
              width: 800,
              height: 600
            }
          },
        },
      ],
      name: 'Set window bounds test',
      shortCut: 'Alt+B',
    });

    expect(spySetWindowBounds).toHaveBeenCalledWith('this', 123456, {
      bounds: {
        x: 100,
        y: 200,
        width: 800,
        height: 600
      }
    });
  });

});
