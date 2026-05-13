import {ConfigService} from '@/config/config-service';
import {Injectable, Logger} from '@nestjs/common';
import {Expression} from '@/config/types/local/expression-local-command';

@Injectable()
export class EvaluateService {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
  }

  /* eslint-disable */
  public evaluateVariable<T>(varName: string, variableExpression: string, varValue: unknown): T {
    return Function(`__${varName}`, `return __${variableExpression};`)(varValue);
  }

  public evaluateExpression(expr: Expression) {
    if (expr === undefined) {
      return undefined
    }
    if (typeof expr !== 'string') {
      throw Error(`Cannot evaluate ${JSON.stringify(expr)}, it must be a string`);
    }
    const variables = this.configService.getVariables();
    const reserved = new Set(['this', 'arguments', 'eval', 'function', 'return', 'var', 'let', 'const']);

    const varMap: Record<string, any> = {};
    const argNames = [];
    const argValues = [];

    for (const [key, value] of Object.entries(variables)) {
      const safeKey = reserved.has(key) ? `__${key}` : key;
      varMap[key] = safeKey;
      argNames.push(safeKey);
      argValues.push(value);
    }

    // Replace variable names in the expression
    for (const [original, safe] of Object.entries(varMap)) {
      const regex = new RegExp(`\\b${original}\\b`, 'g');
      expr = expr.replace(regex, safe);
    }

    const f = new Function(...argNames, `return (${expr});`);
    const result = f(...argValues);
    return result;
  }

  /* eslint-enable */
}
