import {ConfigService} from '@/config/config-service';
import {Injectable, Logger} from '@nestjs/common';
import clc from 'cli-color';
import {BaseProcessingService} from '@/logic/implementation/base-processing.service';
import {EvaluateVariableCommand, UnkownCommand} from '@/config/types/macros';

@Injectable()
export class VariableProcessingService extends BaseProcessingService{
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is EvaluateVariableCommand {
    return Boolean((command as EvaluateVariableCommand).assignVariable);
  }

  /* eslint-disable */
  async execute(command: EvaluateVariableCommand): Promise<void> {
    const variables = this.configService.getVariables();
    let expr= command.expression;
    const reserved = new Set(["this", "arguments", "eval", "function", "return", "var", "let", "const"]);

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
      const regex = new RegExp(`\\b${original}\\b`, "g");
      expr = expr.replace(regex, safe);
    }

    const f = new Function(...argNames, `return (${expr});`);
    const result = f(...argValues);
    this.logger.debug(`Assigning ${result} to ${command.assignVariable} from evaluating ${command.expression}`);
    if (command.assignVariable.includes('.')) {
      const varPath = command.assignVariable.split('.')
      const mainVariable = varPath[0];
      const mainValue = this.configService.getVariables()[varPath[0]];
      let nextVal = mainValue;
      for (let i = 1; i < varPath.length - 1; i++) {
        nextVal = nextVal[varPath[i]]
      }
      nextVal[varPath[varPath.length-1]] = result;
      this.logger.log(`${clc.bold.green(command.assignVariable)}=${clc.yellow(JSON.stringify(result))}`);
      this.configService.setVariable(mainVariable, mainValue);
    } else {
      this.configService.setVariable(command.assignVariable, result);
    }
  }
  /* eslint-enable */
}
