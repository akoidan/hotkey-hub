import {Injectable} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';

@Injectable()
export class VariableResolutionService {
  constructor(private readonly configService: ConfigService) {
  }

  replacePlaceholders<T extends object>(obj: T, variables: Record<string, unknown> | undefined): T {
    if (!variables) {
      return obj;
    }

    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      result[key] = value;
      for (const varName in variables) {
        if (value === `{{${varName}}}`) {
          result[key] = variables[varName] as T[keyof T];
        }
      }
    }
    return result as T;
  }

  replaceEnvVars<T extends object>(obj: T): T {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const globalVars = this.configService.getGlobalVars();
        const scriptVars = this.configService.getVariables();
        const varName = value.slice(2, -2);

        if (scriptVars[varName]) {
          result[key] = scriptVars[varName] as T[keyof T];
        } else if (globalVars[varName]) {
          result[key] = globalVars[varName] as T[keyof T];
        } else {
          throw Error(`Unknown environment variable ${value}`);
        }
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
}
