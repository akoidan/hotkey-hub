import {Test} from '@nestjs/testing';
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

describe('logic-service', () => {
  it('should demo curl request', async() => {
    const testModule = await Test.createTestingModule({
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
            configFilePath: path.join(__dirname, 'fixtures', 'tyrs.jsonc'),
            variablesFilePath: path.join(__dirname, 'fixtures', 'variables.jsonc'),
            macroFilePath: null!,
          })),
          inject: [Logger],
        },
        Logger,
      ],
    }).compile();

    const shortCutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
    const tyrs = testModule.get<ConfigService>(ConfigService);
    const clientService = testModule.get<ClientService>(ClientService);
    clientService.keyPress = jest.fn().mockImplementation();
    const spykeyPress = jest.spyOn(clientService, 'keyPress');
    await tyrs.parseConfig();
    expect(spykeyPress).toHaveBeenCalledTimes(0);
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
});
