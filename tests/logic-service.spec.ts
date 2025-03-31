import type {
  TestingModule,
} from '@nestjs/testing';
import {
  Test,
} from '@nestjs/testing';
import {ShortcutProcessingService} from '@/logic/shortcut-processing.service';
import {ClientService} from '@/client/client-service';
import {Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ConfigReaderService} from '@/config/config-reader-service';
import {handlerProviders} from '@/handlers/handler-module';
import {VariableResolutionService} from '@/logic/variable-resolution.service';
import {CommandProcessingService} from '@/logic/command-processing.service';
import {CircularIndex} from '@/logic/circular-index';
import path from 'path';
import { AsyncStorageModule } from 'src/asyncstore/async-storage.module';

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [AsyncStorageModule],
    providers: [
      ...handlerProviders,
      ShortcutProcessingService,
      VariableResolutionService,
      CommandProcessingService,
      CircularIndex,
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
  it('should keySend client call', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService, 'keyPress');
    await tyrs.parseConfig();
    await shortCutService.processUnknownShortCut({
      commands: [
        {
          destination: 'this',
          keySend: 'f6',
        },
      ],
      name: 'test1',
      shortCut: 'Alt+c',
    });
    expect(spykeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['f6']});
  });

  it('should launch exe client call', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.launchExe = jest.fn().mockImplementation();
    const spyLaucnhExe = jest.spyOn(clientService, 'launchExe');
    await tyrs.parseConfig();
    await shortCutService.processUnknownShortCut({
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

  it('should call macro exe client call', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.killExeById = jest.fn().mockImplementation();
    const spyLaucnhExe = jest.spyOn(clientService, 'killExeById');
    await tyrs.parseConfig();
    await shortCutService.processUnknownShortCut({
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

  it('should handle circular index with multiple destinations through alias', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

    await configService.parseConfig();

    // Test first destination
    await shortCutService.processUnknownShortCut({
      commands: [
        {
          destination: 'multiple',
          keySend: 'f7'
        },
      ],
      name: 'circular-test',
      shortCut: 'Alt+1',
    });

    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['f7']});

    // Test second destination (circular)
    await shortCutService.processUnknownShortCut({
      commands: [
        {
          destination: 'multiple',
          keySend: 'f7'
        },
      ],
      name: 'circular-test',
      shortCut: 'Alt+1',
    });

    expect(spyKeyPress).toHaveBeenCalledWith('that', {holdKeys: [], keys: ['f7']});
    expect(spyKeyPress).toHaveBeenCalledTimes(2);
  });

  it('should resolve variables in commands', async() => {
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

    await shortCutService.processUnknownShortCut({
      commands: [
        {
          destination: 'this',
          typeText: '{{login}}'
        },
      ],
      name: 'variable-test',
      shortCut: 'Alt+2',
    });

    expect(spyTypeText).toHaveBeenCalledWith('this', {text: 'testuser123'});

    // Clean up
    delete process.env.login;
  });

  it('should handle complex macro with delays', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.typeText = jest.fn().mockImplementation();
    clientService.keyPress = jest.fn().mockImplementation();
    const spyTypeText = jest.spyOn(clientService, 'typeText');
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

    await configService.parseConfig();

    await shortCutService.processUnknownShortCut({
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

    expect(spyTypeText).toHaveBeenCalledWith('this', {text: 'testuser'});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['tab']});
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['enter']});
  });

  it('should execute commands in circular mode', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

    await configService.parseConfig();

    const shortcutMapping = configService.getCombinations().find(s => s.name === 'Command circular test');
    expect(shortcutMapping).toBeDefined();

    // First press - first command
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['1']});

    // Second press - second command
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['2']});

    // Third press - third command
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['3']});

    // Fourth press - back to first command
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['1']});
    expect(spyKeyPress).toHaveBeenCalledTimes(4);
  });

  it('should execute threads in circular mode', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

    await configService.parseConfig();

    const shortcutMapping = configService.getCombinations().find(s => s.name === 'Thread circular test');
    expect(shortcutMapping).toBeDefined();

    // First press - first thread
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['a']});

    // Second press - second thread
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['b']});

    // Third press - third thread
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['c']});

    // Fourth press - back to first thread
    await shortCutService.processUnknownShortCut(shortcutMapping!);
    expect(spyKeyPress).toHaveBeenCalledWith('this', {holdKeys: [], keys: ['a']});
    expect(spyKeyPress).toHaveBeenCalledTimes(4);
  });

  // Note: Random circular test is not deterministic, so we just verify it calls one of the commands
  it('should execute random command in circular mode', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const configService = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spyKeyPress = jest.spyOn(clientService, 'keyPress');

    await configService.parseConfig();

    const shortcutMapping = configService.getCombinations().find(s => s.name === 'Random circular test');
    expect(shortcutMapping).toBeDefined();

    await shortCutService.processUnknownShortCut(shortcutMapping!);

    expect(spyKeyPress).toHaveBeenCalledTimes(1);
    const possibleKeys = ['x', 'y', 'z'];
    const calledKey = spyKeyPress.mock.calls[0][1].keys[0];
    expect(possibleKeys).toContain(calledKey);
  });
});
