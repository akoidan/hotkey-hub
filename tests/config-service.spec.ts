import type {TestingModule,} from '@nestjs/testing';
import {Test,} from '@nestjs/testing';
import {Logger} from '@nestjs/common';
import {ConfigService} from '../src/config/config-service';
import {ConfigReaderService} from '../src/config/config-reader-service';
import path from 'path';
import {ConfigPathClass, ENV} from '../src/config/types/config-path';
import {SAVE_TIMEOUT} from '../src/config/config-model';

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
      {
        provide: SAVE_TIMEOUT,
        useValue: -1, // do not save config at at
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
    await expect(tyrs.parseConfig()).rejects.toThrow(/at combinations\.0\.commands\.0/);
  })


  it('Should throw error on invalid conf', async () => {
    const testModule = await getTestModule('invalid-config-fixture-3.jsonc');
    const tyrs = testModule.get<ConfigService>(ConfigService);
    await expect(tyrs.parseConfig()).rejects.toThrow(
      /Passed variable "focusWid1"[\s\S]*doesn't have a description/
    );
  })
});

describe('Config service — JSON Schema variable validation', () => {
  it('Should reject macro variable definition with unknown JSON Schema keyword', async () => {
    const testModule = await getTestModule('macro-invalid-json-schema.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).rejects.toThrow(/unknown keyword: \"type2\"/);
  });

  it('Should reject value whose type does not match the variable JSON Schema', async () => {
    const testModule = await getTestModule('macro-type-mismatch.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).rejects.toThrow(/Type mismatch for variable count/);
  });

  it('Should reject missing required variable (no x-optional, no default)', async () => {
    const testModule = await getTestModule('macro-required-var-missing.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).rejects.toThrow(/requires variable requiredKey/);
  });

  it('Should accept macro call that omits an x-optional variable', async () => {
    const testModule = await getTestModule('macro-optional-var.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).rejects.toThrow();
  });

  it('Should accept macro call that omits variables that have a default value', async () => {
    const testModule = await getTestModule('macro-default-var.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).resolves.not.toThrow(/unknown keyword: "x-optional"/);
  });

  it('Should reject macro definition with unknown key', async () => {
    const testModule = await getTestModule('macro-unknown-key.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).rejects.toThrow(/Unrecognized key.*requiredVariables3/);
  });

  it('Exceptions should contain trace', async () => {
    const testModule = await getTestModule('macro-exception-should-contain-stack.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).rejects.toThrow(/at macros\.testMacro\.commands\.0/);
  });

  it('Exceptions should contain trace', async () => {
    const testModule = await getTestModule('macro-cal-macro-with-var.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).resolves.not.toThrow();
  });

  it('Should accept macro call passing partial object where missing property has nested default', async () => {
    const testModule = await getTestModule('macro-nested-default-var.jsonc');
    const service = testModule.get<ConfigService>(ConfigService);
    await expect(service.parseConfig()).resolves.not.toThrow();
  });

});
