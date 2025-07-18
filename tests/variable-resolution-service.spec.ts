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
import {CommandProcessingService} from '../src/logic/implementation/command-processing.service';
import path from 'path';
import { AsyncStorageModule } from '@/asyncstore/async-storage.module';
import {RandomModule} from "@/random/random.module";
import {SemaphorModule} from "../src/semaphor/semaphor.module";
import {DelayService} from "../src/logic/delay.service";
import {SemaphorService} from "../src/semaphor/semaphor-service";

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [AsyncStorageModule, RandomModule, SemaphorModule],
    providers: [
      ...handlerProviders,
      ShortcutProcessingService,
      DelayService,
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

describe('Variable Service', () => {
  it('should keySend client call', async() => {

  });
});
