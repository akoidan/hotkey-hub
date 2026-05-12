import type {TestingModule} from '@nestjs/testing';
import {Test} from '@nestjs/testing';
import {Logger} from '@nestjs/common';
import {ConfigService} from '../src/config/config-service';
import {ConfigReaderService} from '../src/config/config-reader-service';
import path from 'path';
import fs from 'fs';
import {ConfigPathClass, ENV} from '../src/config/types/config-path';
import {SAVE_TIMEOUT} from '../src/config/config-model';

const globalEnv = {};
const configDir = path.join(__dirname, '..', 'examples', 'config');
const variablesFilePath = path.join(__dirname, 'examples', 'variables-example.jsonc');

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
      {
        provide: ConfigPathClass,
        useValue: {
          configFilePath,
          variablesFilePath,
          macroFilePath: null!,
          setConfigPaths(config?: string, macro?: string, variable?: string) {
          },
        },
      },
      {
        provide: SAVE_TIMEOUT,
        useValue: -1,
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

describe('Private config files', () => {
  const files = fs.existsSync(configDir) ? fs.readdirSync(configDir).filter(f => f.endsWith('.jsonc')) : [];
  if (files.length === 0) {
    it.skip('no config files found', () => {});
  }
  for (const file of files) {
    it(`should parse ${file}`, async () => {
      const testModule = await getTestModule(path.join(configDir, file));
      const service = testModule.get<ConfigService>(ConfigService);
      await expect(service.parseConfig()).resolves.not.toThrow();
    });
  }
});
