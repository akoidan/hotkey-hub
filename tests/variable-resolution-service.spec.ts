import type {TestingModule,} from '@nestjs/testing';
import {Test,} from '@nestjs/testing';
import {ClientService} from '@/client/client-service';
import {Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ConfigReaderService} from '@/config/config-reader-service';
import {VariableResolutionService} from '../src/local/variable-resolution.service';
import path from 'path';
import {AsyncStorageModule} from '@/asyncstore/async-storage.module';
import {RandomModule} from '@/random/random.module';
import {SemaphorModule} from '../src/semaphor/semaphor.module';
import {EvaluateService} from '../src/local/evaluate-serivce';

async function getTestModule(configFilePath: string): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [AsyncStorageModule, RandomModule, SemaphorModule],
    providers: [
      VariableResolutionService,
      EvaluateService,
      {
        provide: ClientService,
        useValue: {
          keyboard: { typeText: jest.fn(), keyPress: jest.fn() },
          mouse: { mouseMoveHuman: jest.fn(), leftMouseClick: jest.fn(), mouseMoveLeftClick: jest.fn() },
          window: { focusWindow: jest.fn(), setWindowBounds: jest.fn(), getActiveWindowId: jest.fn() },
          process: { launchExe: jest.fn(), killExeByName: jest.fn(), killExeById: jest.fn(), findPidsByName: jest.fn() },
          monitor: { getMonitors: jest.fn(), monitorInfo: jest.fn(), getMonitorScaleFactor: jest.fn() },
          app: { ping: jest.fn() }
        },
      },
      {
        provide: ConfigService,
        useFactory: (logger: Logger) => new ConfigService(logger, process.env, new ConfigReaderService(logger, {
          configFilePath: path.join(__dirname, 'fixtures', configFilePath),
          variablesFilePath: path.join(__dirname, 'fixtures', 'variables.jsonc'),
          setConfigPaths(config?: string, macro?: string, variable?: string) {
          },
        },), -1),
        inject: [Logger],
      },
      Logger,
    ],
  }).compile();
}

describe('Variable Service', () => {
  it('should replace macro variables', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replaceMacroVariables(null, {
      'transaction': {
        $ref: 'destination'
      },
      'commands': [
        {
          'destination': {
            $ref: 'destination'
          },
          'focusWid': {
            $ref: 'focusWid'
          }
        },
        {
          'destination': {
            $ref: 'destination'
          },
          'keyPress': {
            $ref: 'keyPress'
          },
          'delayAfter': 50
        }
      ]
    }, {
      'focusWid': {
        $ref: 'widwc'
      },
      'destination': {
        $ref: 'pcwc'
      },
      'keyPress': 'f4'
    }, {
      'destination': {
        'type': 'string'
      },
      'focusWid': {
        'type': 'number'
      },
      'keyPress': {
        'type': 'string'
      }
    });
    expect(res).toEqual({
      'transaction': {
        $ref: 'pcwc'
      },
      'commands': [
        {
          'destination': {
            $ref: 'pcwc'
          },
          'focusWid': {
            $ref: 'widwc'
          }
        },
        {
          'destination': {
            $ref: 'pcwc'
          },
          'keyPress': 'f4',
          'delayAfter': 50
        }
      ]
    });
  });

  it('should replace object macro variables', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replaceMacroVariables(null, {
      'transaction': {
        $ref: 'destination'
      },
      'commands': [
        {
          'destination': {
            $ref: 'this.bd'
          },
        }
      ]
    }, {
      'this': {
        'bd': 'pcbd'
      }
    }, {
      'this': {
        'type': {
          'bd': 'string'
        }
      },
    });
    expect(res).toEqual({
      'transaction': {
        $ref: 'destination'
      },
      'commands': [
        {
          'destination': 'pcbd',
        }
      ]
    });
  });
});
