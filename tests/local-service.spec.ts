import type {TestingModule,} from '@nestjs/testing';
import {Test,} from '@nestjs/testing';
import {ShortcutProcessingService} from '@/local/shortcut-processing.service';
import {ClientService} from '@/client/client-service';
import {Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ConfigReaderService} from '@/config/config-reader-service';
import {remoteHandlerProviders} from '@/remote/remote-handler-module';
import {VariableResolutionService} from '@/local/variable-resolution.service';
import {CommandLocalHandler} from '@/local/implementation/command-local-handler';
import path from 'path';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';
import {RandomModule} from "@/random/random.module";
import {SemaphorModule} from "@/semaphor/semaphor.module";
import {DelayService} from "@/local/delay.service";
import {SemaphorService} from "@/semaphor/semaphor-service";
import {processingProviders} from "@/local/local.module";
import {RgbService} from "@/rgb/rgb-service";
import {RgbServiceI} from "@/rgb/rgb-model";

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  const rgbStub: RgbServiceI = new class {
    public async updateColors(comb: string, hl: boolean): Promise<void> {
    }
    public async setup(): Promise<void> {
    }
  }
  return Test.createTestingModule({
    imports: [AsyncStorageModule, RandomModule, SemaphorModule],
    providers: [
      ...remoteHandlerProviders,
      ...processingProviders,
      ShortcutProcessingService,
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
        provide: ConfigService,
        useFactory: (logger: Logger) => new ConfigService(logger, process.env, new ConfigReaderService(logger, {
          configFilePath: path.join(__dirname, 'fixtures', configFilePath),
          variablesFilePath: path.join(__dirname, 'fixtures', 'variables.jsonc'),
          macroFilePath: null!,
        })),
        inject: [Logger],
      },
      Logger,
    ],
  }).compile();
}

describe('Logic service', () => {

  it('Loop', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService, 'keyPress');
    await tyrs.parseConfig();
    await shortCutService.runShortcut({
      "commands": [
        {
          "loop": 3,
          "commands": [
            {
              "keyPress": "a",
              "destination": "that"
            }
          ]
        },
      ],
      "delayAfter": 0,
      "delayBefore": 200,
      "name": "Tyrs attack each other",
      "shortCut": "Alt+2"
    })
    expect(spykeyPress).toHaveBeenCalledWith('that', {holdKeys: [], keys: ['a']});
    expect(spykeyPress).toHaveBeenCalledTimes(3);
  });


  it('thread', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService, 'keyPress');
    await tyrs.parseConfig();
    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+2', async () => {
      await shortCutService.runShortcut({
        "commands": [
          {
            "threads": [
              [
                {
                  "loop": -1,
                  "commands": [
                    {
                      "keyPress": "a",
                      "destination": "that"
                    }
                  ]
                },
              ],
              [
                {
                  "loop": -1,
                  "commands": [
                    {
                      "keyPress": "a",
                      "destination": "that"
                    }
                  ]
                },
              ]
            ]
          }
        ],
        "delayAfter": 0,
        "delayBefore": 200,
        "name": "Tyrs attack each other",
        "shortCut": "Alt+2"
      })
    });
    expect(spykeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['f6']});
  });



  it('should keyPress client call', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService, 'keyPress');
    await tyrs.parseConfig();
    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+c', async () => {
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
    })
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
    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+c', async () => {
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
    })

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
    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+c', async () => {
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
    });
    expect(spyLaucnhExe).toHaveBeenCalledWith('this', {
      pid: 123,
    });
  });

  it('should handle circular via macro tyr', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

    await configService.parseConfig();

    // Test first destination
    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+c', async () => {
      await shortCutService.runShortcut( {
        "commands": [
          {
            "macro": "tyr",
            "variables": {
              "keyPress": "f5"
            }
          }
        ],
        "name": "Stun",
        "shortCut": "Alt+1"
      });
    });

    expect(spyKeyPress).toHaveBeenCalledWith('desktop', {
      "duration": undefined,
      "holdKeys":  [],
      "keys":  ["f5"],
  });

    // Test second destination (circular)
    await semaphoreService.runOperation('alt+c', async () => {
      await shortCutService.runShortcut( {
        "commands": [
          {
            "macro": "tyr",
            "variables": {
              "keyPress": "f5"
            }
          }
        ],
        "name": "Stun",
        "shortCut": "Alt+1"
      });
    });
      expect(spyKeyPress).toHaveBeenCalledWith('laptop', {
        "duration": undefined,
        "holdKeys":  [],
        "keys":  ["f5"],
      });
    expect(spyKeyPress).toHaveBeenCalledTimes(2);
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
    process.env.login = 'testuser123';

    await configService.parseConfig();

    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+c', async () => {
      await shortCutService.runShortcut({
        commands: [
          {
            destination: 'this',
            typeText: '{{login}}'
          },
        ],
        name: 'variable-test',
        shortCut: 'Alt+2',
      });
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

    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+c', async () => {
      await shortCutService.runShortcut({
        commands: [
          {
            macro: 'loginProceed',
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
    });

    expect(spyTypeText).toHaveBeenCalledWith('this', {text: 'testuser'});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['tab']});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['enter']});
  });



  // Note: Random circular test is not deterministic, so we just verify it calls one of the commands
  it('should execute random command in circular mode', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

    await configService.parseConfig();

    const shortcutMapping = configService.getCombinations().find(s => s.name === 'Random circular test');
    expect(shortcutMapping).toBeDefined();
    const semaphoreService = testModule.get<SemaphorService>(SemaphorService);
    await semaphoreService.runOperation('alt+c', async () => {
      await shortCutService.runShortcut(shortcutMapping!);
    });
    expect(spyKeyPress).toHaveBeenCalledTimes(1);
    const possibleKeys = ['x', 'y', 'z'];
    const calledKey = spyKeyPress.mock.calls[0][1].keys[0];
    expect(possibleKeys).toContain(calledKey);
  });
});
