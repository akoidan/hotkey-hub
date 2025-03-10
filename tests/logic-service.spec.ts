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

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  return Test.createTestingModule({
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
    const testModule = await getTestModule('tyrs.jsonc');
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
    const testModule = await getTestModule('tyrs.jsonc');
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
    const testModule = await getTestModule('tyrs.jsonc');
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
});
