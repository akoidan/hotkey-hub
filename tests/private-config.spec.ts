import type {TestingModule} from '@nestjs/testing';
import {Test} from '@nestjs/testing';
import {Logger} from '@nestjs/common';
import {ConfigService} from '../src/config/config-service';
import {ConfigReaderService} from '../src/config/config-reader-service';
import {ShortcutProcessingService} from '../src/local/shortcut-processing.service';
import {ClientService} from '../src/client/client-service';
import {VariableResolutionService} from '../src/local/variable-resolution.service';
import {CommandLocalHandler} from '../src/local/command-local-handler';
import {DelayService} from '../src/local/delay.service';
import {RgbService} from '../src/rgb/rgb-service';
import {EvaluateService} from '../src/local/evaluate-serivce';
import {ReloadLocalHandler} from '../src/local/implementation/reload-local-handler';
import {remoteHandlerProviders} from '../src/remote/remote-handler-module';
import {localProviders} from '../src/local/local.module';
import {getInfoProviders} from '../src/get-info/get-info-module';
import {AsyncStorageModule} from '../src/asyncstore/async-storage.module';
import {RandomModule} from '../src/random/random.module';
import {SemaphorModule} from '../src/semaphor/semaphor.module';
import {ConfigPathClass, ENV} from '../src/config/types/config-path';
import {SAVE_TIMEOUT} from '../src/config/config-model';
import type {KeyState, RgbServiceI} from '../src/rgb/rgb-model';
import type {Shortcut} from '../src/config/types/shortcut';
import {parse} from 'jsonc-parser';
import path from 'path';
import fs from 'fs';

const globalEnv = {};
const configDir = path.join(__dirname, '..', 'examples', 'config');
const variablesFilePath = path.join(__dirname, '..', 'examples', 'variables-example.jsonc');

const rgbStub: RgbServiceI = new class {
  public updateColor(_comb: string, _hl: KeyState): void {}
  public async setup(): Promise<boolean> { return false; }
};

const clientMock = {
  keyboard: {typeText: jest.fn(), keyPress: jest.fn()},
  mouse: {mouseMoveHuman: jest.fn(), leftMouseClick: jest.fn(), mouseMoveLeftClick: jest.fn()},
  window: {focusWindow: jest.fn(), setWindowBounds: jest.fn(), getActiveWindowId: jest.fn()},
  process: {launchExe: jest.fn(), killExeByName: jest.fn(), killExeById: jest.fn(), findPidsByName: jest.fn()},
  monitor: {getMonitors: jest.fn(), monitorInfo: jest.fn(), getMonitorScaleFactor: jest.fn()},
  app: {ping: jest.fn()},
};

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  const testModule = await Test.createTestingModule({
    imports: [AsyncStorageModule, RandomModule, SemaphorModule],
    providers: [
      ...remoteHandlerProviders,
      ...localProviders,
      ...getInfoProviders,
      ShortcutProcessingService,
      EvaluateService,
      DelayService,
      VariableResolutionService,
      CommandLocalHandler,
      {provide: SAVE_TIMEOUT, useValue: -1},
      {provide: RgbService, useValue: rgbStub},
      {provide: ClientService, useValue: clientMock},
      {
        provide: ConfigPathClass,
        useValue: {
          configFilePath,
          variablesFilePath,
          macroFilePath: null!,
          setConfigPaths(_config?: string, _macro?: string, _variable?: string) {},
        },
      },
      ConfigService,
      ConfigReaderService,
      {provide: ENV, useValue: globalEnv},
      Logger,
    ],
  }).compile();
  testModule.get<ReloadLocalHandler>(ReloadLocalHandler).setKeyBindingService({} as any);
  return testModule;
}

function readCombinations(filePath: string): Array<{name?: string; shortCut?: string}> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = parse(content) as {combinations?: Array<{name?: string; shortCut?: string}>};
    return config?.combinations ?? [];
  } catch {
    return [];
  }
}

const files = fs.existsSync(configDir) ? fs.readdirSync(configDir).filter(f => f.endsWith('.jsonc')) : [];

describe('Private config files', () => {
  if (files.length === 0) {
    it.skip('no config files found', () => {});
  }

  for (const file of files) {
    describe(file, () => {
      let testModule: TestingModule;
      let parseError: Error | null = null;

      beforeAll(async () => {
        try {
          testModule = await getTestModule(path.join(configDir, file));
          await testModule.get<ConfigService>(ConfigService).parseConfig();
        } catch (e) {
          parseError = e as Error;
        }
      });

      it('should parse config', () => {
        if (parseError) throw parseError;
      });

      describe('shortcuts', () => {
        const combinations = readCombinations(path.join(configDir, file));

        if (combinations.length === 0) {
          it.skip('no shortcuts', () => {});
        }

        for (const combo of combinations) {
          const label = [combo.shortCut, combo.name].filter(Boolean).join(': ');
          it(label, async () => {
            if (parseError) return;
            const service = testModule.get<ConfigService>(ConfigService);
            const shortcutService = testModule.get<ShortcutProcessingService>(ShortcutProcessingService);
            const shortcut = service.getCombinations().find((s: Shortcut) => s.shortCut === combo.shortCut);
            if (shortcut) {
              await shortcutService.runShortcut(shortcut);
            }
          });
        }
      });
    });
  }
});
