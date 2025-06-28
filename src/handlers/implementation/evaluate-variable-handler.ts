import {ConfigService} from '@/config/config-service';
import {Logger} from '@nestjs/common';
import type {Command, EvaluateVariable} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';
import type {ClientService} from '@/client/client-service';


export class EvaluateVariableHandler extends CommandHandler {
  constructor(
      clientService: ClientService,
      private readonly logger: Logger,
      private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: Command): command is EvaluateVariable {
    return 'assignVariable' in command;
  }

  /* eslint-disable */
  async execute(destination: string, command: EvaluateVariable): Promise<void> {
    const vars = this.configService.getVariables();
    const varNames = Object.keys(vars);
    const varValues = Object.values(vars);
    const f = new Function(...varNames, `return (${command.expression});`);
    const result = f(...varValues);
    this.logger.debug(`Assigning ${result} to ${command.assignVariable} from evaluating ${command.expression}`);
    if (command.assignVariable.includes('.')) {
      const varPath = command.assignVariable.split('.')
      const mainVariable = varPath[0];
      const mainValue = this.configService.getVariables()[varPath[0]];
      let nextVal = mainValue;
      let nextVarName = mainVariable;
      for (let i = 1; i < nextVarName.length - 1; i++) {
        nextVal = nextVal[varPath[i]]
      }
      nextVal[varPath[varPath.length-1]] = result;
      this.configService.setVariable(mainVariable, mainValue);
    } else {
      this.configService.setVariable(command.assignVariable, result);
    }
  }
  /* eslint-enable */
}
