import type {
  TestingModule,
} from '@nestjs/testing';
import {
  Test,
} from '@nestjs/testing';
import {ShortcutProcessingService} from '../src/local/shortcut-processing.service';
import {ClientService} from '@/client/client-service';
import {Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ConfigReaderService} from '@/config/config-reader-service';
import {remoteHandlerProviders} from '../src/remote/remote-handler-module';
import {VariableResolutionService} from '../src/local/variable-resolution.service';
import {RemoteCommandHandler} from '../src/local/implementation/remote-command-handler';
import path from 'path';
import { AsyncStorageModule } from '@/asyncstore/async-storage.module';
import {RandomModule} from "@/random/random.module";
import {SemaphorModule} from "../src/semaphor/semaphor.module";
import {DelayService} from "../src/local/delay.service";
import {SemaphorService} from "../src/semaphor/semaphor-service";

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [AsyncStorageModule, RandomModule, SemaphorModule],
    providers: [
      VariableResolutionService,
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

describe('Variable Service', () => {
  it('should keySend client call', async() => {
    const testModule = await getTestModule("config-fixture.jsonc");
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replacePlaceholders({
      "transaction": "{{destination}}",
      "commands": [
        {
          "destination": "{{destination}}",
          "focusWid": "{{focusWid}}"
        },
        {
          "destination": "{{destination}}",
          "keySend": "{{keySend}}",
          "delayAfter": 50
        }
      ]
    }, {
      "focusWid": "{{widwc}}",
      "destination": "{{pcwc}}",
      "keySend": "f4"
    }, {
      "destination": {
        "type": "string"
      },
      "focusWid": {
        "type": "number"
      },
      "keySend": {
        "type": "string"
      }
    });
    expect(res).toEqual({
      "transaction": "{{pcwc}}",
        "commands": [
      {
        "destination": "{{pcwc}}",
        "focusWid": "{{widwc}}"
      },
      {
        "destination": "{{pcwc}}",
        "keySend": "f4",
        "delayAfter": 50
      }
    ]
    });
  });
});
