import {ConfigService} from '@/config/config-service';
import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {ExpressionLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import {EvaluateService} from '@/local/evaluate-serivce';
import {VariableResolutionService} from '@/local/variable-resolution.service';

@Injectable()
export class ExpressionLocalHandler extends BaseLocalHandler {
  constructor(
    protected readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly evaluateService: EvaluateService,
    private readonly variableService: VariableResolutionService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is ExpressionLocalCommand {
    return 'expression' in command;
  }

  /* eslint-disable */
  async execute(
    command: ExpressionLocalCommand
  ): Promise<void> {
    const result = this.evaluateService.evaluateExpression(command.expression);
    const varToAssign = this.variableService.getValue(command.assignVariable);
    this.logger.debug(`Assigning ${result} to ${varToAssign} from evaluating ${command.expression}`);
    if (varToAssign.includes('.')) {
      const varPath = varToAssign.split('.')
      const mainVariable = varPath[0];
      const mainValue = this.configService.getVariables()[varPath[0]];
      let nextVal = mainValue;
      for (let i = 1; i < varPath.length - 1; i++) {
        nextVal = nextVal[varPath[i]]
      }
      nextVal[varPath[varPath.length - 1]] = result;
      this.configService.setVariable(mainVariable, mainValue, true);
    } else {
      this.configService.setVariable(varToAssign, result, true);
    }
  }

  /* eslint-enable */
}
