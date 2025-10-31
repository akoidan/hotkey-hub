import {ConfigService} from '@/config/config-service';
import {Injectable, Logger} from '@nestjs/common';
import clc from 'cli-color';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {ExpressionLocalCommand, UnknownCommand} from '@/config/types/local-commands';
import {EvaluateService} from '@/local/evaluate-serivce';

@Injectable()
export class ExpressionLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly evaluateService: EvaluateService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is ExpressionLocalCommand {
    return Boolean((command as ExpressionLocalCommand).expression);
  }

  /* eslint-disable */
  async *execute(command: ExpressionLocalCommand): AsyncGenerator<void> {
    const result = this.evaluateService.evaluateExpression(command.expression);
    this.logger.debug(`Assigning ${result} to ${command.assignVariable} from evaluating ${command.expression}`);
    if (command.assignVariable.includes('.')) {
      const varPath = command.assignVariable.split('.')
      const mainVariable = varPath[0];
      const mainValue = this.configService.getVariables()[varPath[0]];
      let nextVal = mainValue;
      for (let i = 1; i < varPath.length - 1; i++) {
        nextVal = nextVal[varPath[i]]
      }
      nextVal[varPath[varPath.length - 1]] = result;
      await this.configService.setVariable(mainVariable, mainValue);
    } else {
      await this.configService.setVariable(command.assignVariable, result);
    }
    this.logger.debug(`${clc.bold.green(command.assignVariable)}=${clc.yellow(JSON.stringify(result))}`);
    yield undefined;
  }
  /* eslint-enable */
}
