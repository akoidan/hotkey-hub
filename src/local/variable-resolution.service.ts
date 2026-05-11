import {Inject, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import type {VariablesDefinition} from '@/config/types/local/macro-local-command';
import {variableRegex, VariableValue} from '@/config/types/variables';
import {EvaluateService} from '@/local/evaluate-serivce';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {AsyncLocalStorage} from 'async_hooks';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';

@Injectable()
export class VariableResolutionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly evaluateService: EvaluateService,
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    private readonly logger: Logger,
  ) {
  }

  replaceMacroVariables<T = unknown>(
    key: string | null,
    value: T,
    variablesIN: Record<string, unknown> | undefined,
    definition: VariablesDefinition
  ): T {
    if (!variablesIN) {
      return value;
    }
    // we need to modify variable to match it with macro definition
    const variables = structuredClone(variablesIN) as Record<string, unknown>;
    for (const varDef in definition) {
      if (!(varDef in variables) && definition[varDef].type === 'any') {
        // define key, in case we didnt pass variable (in config)
        // so we dont have exception on missing variable
        variables[varDef] = undefined;
      }
    }
    if (Array.isArray(value)) {
      // thread each array element as the whole object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return value.map(item => this.replaceMacroVariables(null, item, variables, definition)) as any;
    } else if (typeof value === 'object' && !(value as VariableValue).$ref) {
      const result: Record<string, unknown> = {};
      for (const [innerKey, innerValue] of Object.entries(value as object)) {
        result[innerKey] = this.replaceMacroVariables(innerKey, innerValue as VariableValue, variables, definition);
      }
      return result as T;
    }
    return this.replaceMacroPrimitive(key!, value, variables ,definition);
  }

  private extractVariableName(variable: unknown): { varName: string|undefined, varExpress: string|undefined} {
    if (variable && (variable as VariableValue).$ref) {
      return this.extratVarNameInner((variable as VariableValue).$ref);
    }
    return  {varName: undefined, varExpress: undefined} ;
  }

  private extratVarNameInner(expression: string): { varName: string|undefined, varExpress: string|undefined} {
    const name = variableRegex.exec(expression);
    if (!name) {
      throw Error(`Illegal varname ${expression}`);
    }
    return {varName: name.groups!.variable, varExpress: expression};
  }

  private replaceMacroPrimitive<T>(
    key: string,
    value: T,
    variables: Record<string, unknown>,
    definition: VariablesDefinition,
  ): T {
    let varName: string|undefined;
    let varExpress: string|undefined;
    const exactValue = typeof value === 'string' && key === 'if' && definition?.[value];
    if (exactValue) {
      ({varName, varExpress} = this.extratVarNameInner(value));
    } else {
      ({varName, varExpress} = this.extractVariableName(value))!;
    }
    if (!varName || !definition?.[varName]) {
      return value;
    }
    if (Object.hasOwn(variables, varName)) {
      this.logger.verbose(`Replaced variable ${varName} to ${JSON.stringify(variables[varName])} for ${JSON.stringify(value)}`);
      const res =  this.evaluateService.evaluateVariable(varName, varExpress!, variables[varName]);
      if (exactValue && typeof res === 'string') {
        return `"${res}"` as T;
      }
      return res as T;
    }
    if (definition[varName]!.optional) {
      if (definition[varName]!.default) {
        this.logger.verbose(`Putting default ${varName}=${definition[varName]!.default} from ${JSON.stringify(value)}`);
        return definition[varName]!.default as T;
      }
      this.logger.verbose(`Omitting variable ${varName} from ${JSON.stringify(value)} since it's optional`);
      return value;
    }
    throw Error(`Unable to resolve macros variable ${varName} when running ${JSON.stringify(value)}`);
  }


  replaceVariables<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      if (key === 'variables') {
        result[key] = this.replaceVarsReqursively(value);
      } else {
        result[key] = this.getValue(value);
      }
    }
    return result as T;
  }

  private replaceVarsReqursively<T>(objVars: T): T {
    if (Array.isArray(objVars)) {
      // thread each array element as the whole object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return objVars.map((item: T) => this.replaceVarsReqursively<T>(item)) as unknown as T;
    }
    if (objVars && typeof objVars === 'object' && !(objVars as unknown as VariableValue).$ref) {
      const result = {} as Record<string, unknown>;
      for (const [key, value] of Object.entries(objVars)) {
        result[key] = this.replaceVarsReqursively(value);
      }
      return result as T;
    }
    return this.getValue<T>(objVars);
  }

  private getValue<T>(value: T): T {
    const {varName, varExpress} = this.extractVariableName(value);
    if (!varName) {
      return value;
    }
    const globalVars = this.configService.getGlobalVars();
    const scriptVars = this.configService.getVariables();
    if (varName in scriptVars) { // if object has the key, even if it's null or undefined
      return this.evaluateService.evaluateVariable<T>(varName, varExpress!, scriptVars[varName]) as unknown as T;
    }
    if (varName in globalVars) { // if object has the key, even if it's null or undefined
      return this.evaluateService.evaluateVariable<T>(varName, varExpress!, globalVars[varName]) as unknown as T;
    }
    const id = this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
    throw Error(`Unable to replace env variable ${(value as VariableValue)?.$ref ?? JSON.stringify(value)} for ${id}`);
  }
}
