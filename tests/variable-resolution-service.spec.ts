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



  it('should resolve optional variable to undefined when not passed', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replaceMacroVariables(null, {
      'destination': 'this',
      'performOnRemote': 'keyPress',
      'variables': {
        'key': { $ref: 'optKey' }
      }
    }, {}, {
      'optKey': { 'x-optional': true, type: 'string' }
    });
    expect(res).toEqual({
      'destination': 'this',
      'performOnRemote': 'keyPress',
      'variables': {
        'key': undefined
      }
    });
  });

  it('should substitute default value when variable is not passed', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replaceMacroVariables(null, {
      'destination': 'this',
      'delayAfter': { $ref: 'delay' },
      'performOnRemote': 'keyPress',
      'variables': {
        'key': { $ref: 'key' }
      }
    }, {
      'key': 'f1'
    }, {
      'key': { type: 'string' },
      'delay': { type: 'number', default: 500 }
    });
    expect(res).toEqual({
      'destination': 'this',
      'delayAfter': 500,
      'performOnRemote': 'keyPress',
      'variables': {
        'key': 'f1'
      }
    });
  });

  it('should substitute falsy default (0) correctly', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replaceMacroVariables(null, {
      'count': { $ref: 'count' }
    }, {}, {
      'count': { type: 'number', default: 0 }
    });
    expect(res).toEqual({ 'count': 0 });
  });

  it('macro calling macro — outer default propagates to inner variable', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    // outerDelay has a default; the inner macro call references it via $ref
    const res = variableService.replaceMacroVariables(null, {
      'macro': 'innerMacro',
      'variables': {
        'innerDelay': { $ref: 'outerDelay' }
      }
    }, {}, {
      'outerDelay': { type: 'number', default: 100 }
    });
    expect(res).toEqual({
      'macro': 'innerMacro',
      'variables': {
        'innerDelay': 100
      }
    });
  });

  it('macro calling macro — explicitly passed value overrides outer default', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replaceMacroVariables(null, {
      'macro': 'innerMacro',
      'variables': {
        'innerDelay': { $ref: 'outerDelay' }
      }
    }, {
      'outerDelay': 999
    }, {
      'outerDelay': { type: 'number', default: 100 }
    });
    expect(res).toEqual({
      'macro': 'innerMacro',
      'variables': {
        'innerDelay': 999
      }
    });
  });

  it('macro calling macro — outer x-optional not passed, inner variable becomes undefined', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    const res = variableService.replaceMacroVariables(null, {
      'macro': 'innerMacro',
      'variables': {
        'innerKey': { $ref: 'outerKey' }
      }
    }, {}, {
      'outerKey': { 'x-optional': true, type: 'string' }
    });
    expect(res).toEqual({
      'macro': 'innerMacro',
      'variables': {
        'innerKey': undefined
      }
    });
  });

  it('macro calling macro — required outer variable not passed throws', async () => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    expect(() => variableService.replaceMacroVariables(null, {
      'macro': 'innerMacro',
      'variables': {
        'innerKey': { $ref: 'outerRequired' }
      }
    }, {}, {
      'outerRequired': { type: 'string' }
    })).toThrow(/Unable to resolve macros variable outerRequired/);
  });

  it('should fill nested schema defaults into a partially passed variable', async() => {
    const testModule = await getTestModule('config-fixture.jsonc');
    const variableService = testModule.get<VariableResolutionService>(VariableResolutionService);
    // opts is passed as a partial object {key: 'tab'}; delay is absent but has a default
    // inside the schema's properties — the nested default should be filled in
    const res = variableService.replaceMacroVariables(null, {
      destination: 'this',
      variables: {opts: {$ref: 'opts'}},
    }, {
      opts: {key: 'tab'},
    }, {
      opts: {
        type: 'object',
        properties: {
          key: {type: 'string'},
          delay: {type: 'number', default: 100},
        },
      },
    });
    expect(res).toEqual({
      destination: 'this',
      variables: {opts: {key: 'tab', delay: 100}},
    });
  });
});
