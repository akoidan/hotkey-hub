import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {extractVariableName} from '@/config/types/variables';
import {VariablesDefinition} from '@/config/types/local-commands';

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
    } else if (typeof command === 'object') {
      const result: Partial<T> = {};
      for (const [key, value] of Object.entries(command) as [keyof T, T[keyof T]][]) {
        // thread objects as primitive, do not go down
        result[key] = this.replacePlaceholders(value as VariablesDefinition, values, definition) as T[keyof T];
      }
      return result as T;
    }
    return this.replacePrimitive(command, values ,definition);
  }

  private replacePrimitive<T>(command: T, values: Record<string, unknown>, definition: VariablesDefinition,): T {
    const varName = extractVariableName(command)!;
    if (!varName || !definition[varName]) {
      return command;
    }
    if (values[varName]) {
      this.logger.debug(`Replaced variable ${varName} to ${values[varName] as string} for ${JSON.stringify(command)}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return values[varName] as T;
    }
    if (definition[varName]!.optional) {
      this.logger.debug(`Omitting variable ${varName} from ${JSON.stringify(command)} since it's optional`);
      return command;
    }
    throw Error(`Unable to resolve macros variable ${varName} when running ${JSON.stringify(command)}`);
  }

  replaceEnvVars<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      const varName = extractVariableName(value);
      if (varName) {
        const globalVars = this.configService.getGlobalVars();
        const scriptVars = this.configService.getVariables();
        if (scriptVars[varName]) {
          result[key] = scriptVars[varName] as T[keyof T];
        } else if (globalVars[varName]) {
          result[key] = globalVars[varName] as T[keyof T];
        } else {
          throw Error(`Unknown environment variable ${value as string}`);
        }
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
}
