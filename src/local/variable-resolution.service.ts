import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import type {VariablesDefinition} from '@/config/types/local/macro-local-command';
import {variableRegex, VariableValue} from '@/config/types/variables';
import {EvaluateService} from '@/local/evaluate-serivce';

@Injectable()
export class VariableResolutionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly evaluateService: EvaluateService,
    private readonly logger: Logger,
  ) {
  }

  replaceMacroVariables<T=unknown>(
    command: T,
    values: Record<string, unknown> | undefined,
    definition: VariablesDefinition,
    key: string|null = null
  ): T {
    if (!values) {
      return command;
    }
    if (Array.isArray(command)) {
      // thread each array element as the whole object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return command.map(item => this.replaceMacroVariables(item, values, definition)) as any;
    } else if (typeof command === 'object' && !(command as VariableValue).$ref) {
      const result: Record<string, unknown> = {};
      for (const [innerKey, value] of Object.entries(command as object)) {
        result[innerKey] = this.replaceMacroVariables(value as VariableValue, values, definition, innerKey);
      }
      return result as T;
    }
    return this.replaceMacroPrimitive(command, values ,definition, key!);
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
    command: T,
    values: Record<string, unknown>,
    definition: VariablesDefinition,
    key: string
  ): T {
    let varName: string|undefined;
    let varExpress: string|undefined;
    const exactValue = typeof command === 'string' && key === 'if' && definition?.[command];
    if (exactValue) {
      ({varName, varExpress} = this.extratVarNameInner(command));
    } else {
      ({varName, varExpress} = this.extractVariableName(command))!;
    }
    if (!varName || !definition?.[varName]) {
      return command;
    }
    if (Object.hasOwn(values, varName)) {
      this.logger.verbose(`Replaced variable ${varName} to ${JSON.stringify(values[varName])} for ${JSON.stringify(command)}`);
      const res =  this.evaluateService.evaluateVariable(varName, varExpress!, values[varName]);
      if (exactValue && typeof res === 'string') {
        return `"${res}"` as T;
      }
      return res as T;
    }
    if (definition[varName]!.optional) {
      if (definition[varName]!.default) {
        this.logger.verbose(`Putting default ${varName}=${definition[varName]!.default} from ${JSON.stringify(command)}`);
        return definition[varName]!.default as T;
      }
      this.logger.verbose(`Omitting variable ${varName} from ${JSON.stringify(command)} since it's optional`);
      return command;
    }
    throw Error(`Unable to resolve macros variable ${varName} when running ${JSON.stringify(command)}`);
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
    throw Error(`Unknown environment variable ${(value as VariableValue)?.$ref ?? JSON.stringify(value)}`);
  }
}
