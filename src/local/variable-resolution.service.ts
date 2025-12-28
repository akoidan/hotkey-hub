import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {VariablesDefinition} from '@/config/types/local-commands';
import {variableRegex, VariableValue} from '@/config/types/variables';

@Injectable()
export class VariableResolutionService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
  }

  replacePlaceholders<T extends object>(command: T, values: Record<string, unknown> | undefined, definition: VariablesDefinition): T {
    if (!values) {
      return command;
    }
    if (Array.isArray(command)) {
      // thread each array element as the whole object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return command.map(item => this.replacePlaceholders(item, values, definition)) as any;
    } else if (typeof command === 'object' && !(command as VariableValue).$ref) {
      const result: Partial<T> = {};
      for (const [key, value] of Object.entries(command) as [keyof T, T[keyof T]][]) {
        // thread objects as primitive, do not go down
        result[key] = this.replacePlaceholders(value as VariablesDefinition, values, definition) as T[keyof T];
      }
      return result as T;
    }
    return this.replacePrimitive(command, values ,definition);
  }

  private extractVariableName(variable: unknown): { varName: string|undefined, varExpress: string|undefined} {
    if (typeof variable === 'object' && (variable as VariableValue).$ref) {
      const name = variableRegex.exec((variable as VariableValue).$ref);
      if (!name) {
        throw Error(`Illegal varname ${(variable as VariableValue).$ref}`);
      }
      return {varName: name.groups!.variable, varExpress: (variable as VariableValue).$ref} ;
    }
    return  {varName: undefined, varExpress: undefined} ;
  }

  private replacePrimitive<T>(command: T, values: Record<string, unknown>, definition: VariablesDefinition,): T {
    const {varName, varExpress} = this.extractVariableName(command)!;
    if (!varName || !definition[varName]) {
      return command;
    }
    if (Object.hasOwn(values, varName)) {
      this.logger.debug(`Replaced variable ${varName} to ${JSON.stringify(values[varName])} for ${JSON.stringify(command)}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return this.evaluateVariable(varName, varExpress!, values[varName]);
    }
    if (definition[varName]!.optional) {
      if (definition[varName]!.default) {
        this.logger.debug(`Putting default ${varName}=${definition[varName]!.default} from ${JSON.stringify(command)}`);
        return definition[varName]!.default as T;
      }
      this.logger.debug(`Omitting variable ${varName} from ${JSON.stringify(command)} since it's optional`);
      return command;
    }
    throw Error(`Unable to resolve macros variable ${varName} when running ${JSON.stringify(command)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  public evaluateVariable<T>(varName: string, variableExpression: string, varValue: unknown): T {
    // eslint-disable-next-line no-new-func,@typescript-eslint/no-implied-eval,@typescript-eslint/no-unsafe-return
    return Function(varName, `return ${variableExpression};`)(varValue);
  }

  replaceEnvVars<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      const {varName, varExpress} = this.extractVariableName(value);
      if (varName) {
        const globalVars = this.configService.getGlobalVars();
        const scriptVars = this.configService.getVariables();
        if (scriptVars[varName]) {
          result[key] = this.evaluateVariable<T[keyof T]>(varName, varExpress!, scriptVars[varName]);
        } else if (globalVars[varName]) {
          result[key] = this.evaluateVariable<T[keyof T]>(varName, varExpress!, globalVars[varName]);
        } else {
          throw Error(`Unknown environment variable ${(value as VariableValue)?.$ref ?? JSON.stringify(value)}`);
        }
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
}
