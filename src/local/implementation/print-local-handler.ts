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

  // eslint-disable-next-line require-yield,@typescript-eslint/require-await
  async* execute(comb: PrintLocalCommand): AsyncGenerator<void> {
    const result: unknown = this.evaluateService.evaluateExpression(comb.print);
    this.logger.log(`${clc.yellow(comb.print)}=${clc.bold.green(result)}`);
    yield undefined;
  }
}

