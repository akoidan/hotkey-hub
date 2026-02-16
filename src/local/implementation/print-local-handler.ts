import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {PrintLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import {EvaluateService} from '@/local/evaluate-serivce';
import clc from 'cli-color';

@Injectable()
export class PrintLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
    private readonly evaluateService: EvaluateService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is PrintLocalCommand {
    return Boolean((command as PrintLocalCommand).print);
  }

  async execute(comb: PrintLocalCommand): Promise<void> {
    const result: unknown = this.evaluateService.evaluateExpression(comb.print);
    this.logger.log(`${clc.yellow(comb.print)}=${clc.bold.green(result)}`);
  }
}

