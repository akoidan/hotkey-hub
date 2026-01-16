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
import {processingProviders} from '../src/local/local.module';
import {RgbService} from '../src/rgb/rgb-service';
import {RgbServiceI} from '../src/rgb/rgb-model';
import {ConfigPathClass, ENV} from '../src/config/types/config-path';
import process from 'node:process';
import {ReloadLocalHandler} from '../src/local/implementation/reload-local-handler';
import {EvaluateService} from '../src/local/evaluate-serivce';

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
      ...processingProviders,
      ShortcutProcessingService,
      EvaluateService,
      DelayService,
      {
        provide: RgbService,
        useValue: rgbStub
      },
      VariableResolutionService,
      CommandLocalHandler,
      {
        provide: ClientService,
        useClass: class Empty {
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
    clientService.keyPress = jest.fn().mockImplementation();
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');
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
    clientService.mouseMoveHuman = jest.fn().mockImplementation();
    const spyMouseClick = jest.spyOn(clientService, 'mouseMoveHuman');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          performOnRemote: 'mouseMoveClick',
          variables: {
            x: 100,
            y: 200
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
    clientService.findPidsByName = jest.fn().mockImplementation();
    const spyFindPids = jest.spyOn(clientService, 'findPidsByName');
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

    expect(spyFindPids).toHaveBeenCalledWith('this', {
      name: 'notepad.exe'
    });
  });

  it('should execute kill process by name remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.killExeByName = jest.fn().mockImplementation();
    const spyKillProcess = jest.spyOn(clientService, 'killExeByName');
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

    expect(spyKillProcess).toHaveBeenCalledWith('this', {
      name: 'notepad.exe'
    });
  });

  it('should execute find process windows remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.getProcessWindows = jest.fn().mockImplementation(() => ({wids: ['123', '456']}));
    const spyGetWindows = jest.spyOn(clientService, 'getProcessWindows');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          get: 'getWindowsIdByPid',
          variables: {
            pid: 789,
          },
          assignIds: 'windowIds',
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
    clientService.getProcessWindows = jest.fn().mockImplementation(() => ({wids: ['123', '456']}));
    const spyGetWindows = jest.spyOn(clientService, 'getProcessWindows');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          findProcessesWindows: [789, 101],
          assignIds: ['window1', 'window2'],
        },
      ],
      name: 'Find processes windows test',
      shortCut: 'Alt+W',
    });

    expect(spyGetWindows).toHaveBeenCalledWith('this', 789);
    expect(spyGetWindows).toHaveBeenCalledWith('this', 101);
    expect(spyGetWindows).toHaveBeenCalledTimes(2);
  });

  it('should execute focus process window remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.focusExe = jest.fn().mockImplementation();
    const spyFocusExe = jest.spyOn(clientService, 'focusExe');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          focusPid: 789
        },
      ],
      name: 'Focus process window test',
      shortCut: 'Alt+F',
    });

    expect(spyFocusExe).toHaveBeenCalledWith('this', {pid: 789});
  });

  it('should execute focus window remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.focusWindow = jest.fn().mockImplementation();
    const spyFocusWindow = jest.spyOn(clientService, 'focusWindow');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          focusWid: 789
        },
      ],
      name: 'Focus window test',
      shortCut: 'Alt+F',
    });

    expect(spyFocusWindow).toHaveBeenCalledWith('this', {wid: 789});
  });

  it('should execute type text remote command', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.typeText = jest.fn().mockImplementation();
    const spyTypeText = jest.spyOn(clientService, 'typeText');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          typeText: 'Hello World'
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
    clientService.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService, 'keyPress');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          loop: 3,
          commands: [
            {
              keyPress: 'a',
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
    clientService.leftMouseClick = jest.fn().mockImplementation();
    clientService.mouseMoveHuman = jest.fn().mockImplementation();
    const skyMouseMoveClick = jest.spyOn(clientService, 'mouseMoveHuman');
    const skyMouseClick = jest.spyOn(clientService, 'leftMouseClick');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          threads: [
            {
              name: 't1',
              commands: [
                {
                  mouseMoveX: 537,
                  mouseMoveY: 123,
                  destination: 'that'
                }
              ]
            },
            {
              name: 't2',
              commands: [
                {
                  leftMouseClick: true,
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
    expect(skyMouseMoveClick).toHaveBeenCalledWith('that', {x: 537, y: 123, pixelsPerIteration: 20});
    expect(skyMouseClick).toHaveBeenCalledWith('that');
  });


  it('should keyPress client call', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService, 'keyPress');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          keyPress: 'f6',
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
    clientService.launchExe = jest.fn().mockImplementation();
    const spyLaucnhExe = jest.spyOn(clientService, 'launchExe');
    await tyrs.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          launch: 'C:\\Windows\\System32\\shutdown.exe',
          arguments: ['/s', '/t', '0'],
        },
      ],
      name: 'Launch exe test',
      shortCut: 'Alt+F11',
    });

    expect(spyLaucnhExe).toHaveBeenCalledWith('this', {
      arguments: ['/s', '/t', '0'],
      path: 'C:\\Windows\\System32\\shutdown.exe',
      waitTillFinish: false,
    });
  });

  it('should call macro exe client call', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.killExeById = jest.fn().mockImplementation();
    const spyLaucnhExe = jest.spyOn(clientService, 'killExeById');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          killByPid: 123,
        },
      ],
      name: 'Launch exe test',
      shortCut: 'Alt+F11',
    });
    expect(spyLaucnhExe).toHaveBeenCalledWith('this', {
      pid: 123,
    });
  });


  it('should resolve variables in commands', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);

    clientService.typeText = jest.fn().mockImplementation();
    const spyTypeText = jest.spyOn(clientService, 'typeText');

    // Set up environment variable
    (globalEnv as any)['login'] = 'testuser123';

    await configService.parseConfig();

    await shortCutService.runShortcut({
      commands: [
        {
          destination: 'this',
          typeText: {
            $ref: 'login'
          }
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
    clientService.typeText = jest.fn().mockImplementation();
    clientService.keyPress = jest.fn().mockImplementation();
    const spyTypeText = jest.spyOn(clientService, 'typeText');
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

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

    expect(spyTypeText).toHaveBeenCalledWith('this', {text: 'testuser'});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['tab']});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['enter']});
  });

});
