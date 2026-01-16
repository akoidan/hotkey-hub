import type {TestingModule,} from '@nestjs/testing';
import {Test,} from '@nestjs/testing';
import {Logger} from '@nestjs/common';
import {ConfigService} from '../src/config/config-service';
import {ConfigReaderService} from '../src/config/config-reader-service';
import path from 'path';
import {ConfigPathClass, ENV} from '../src/config/types/config-path';
import {EvaluateService} from '../src/local/evaluate-serivce';

const globalEnv = {};

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
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
}

describe('Config service', () => {
  it('Should throw error on invalid conf', async () => {
    const testModule = await getTestModule('invalid-config-fixture.jsonc');
    const tyrs = testModule.get<ConfigService>(ConfigService);
    await expect(tyrs.parseConfig()).rejects.toThrow(/Unrecognized key: \"key2\" at variables/);
  })


  it('Should throw error on invalid conf', async () => {
    const testModule = await getTestModule('invalid-config-fixture-3.jsonc');
    const tyrs = testModule.get<ConfigService>(ConfigService);
    await expect(tyrs.parseConfig()).rejects.toThrow(
      /Passed variable "focusWid1"[\s\S]*doesn't have a description/
    );
  })
});
