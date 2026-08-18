import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {PrintLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import {EvaluateService} from '@/local/evaluate-serivce';

@Injectable()
export class PrintLocalHandler extends BaseLocalHandler {
  constructor(
    protected readonly logger: Logger,
    private readonly evaluateService: EvaluateService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is PrintLocalCommand {
    return 'print' in command;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(comb: PrintLocalCommand): Promise<void> {
    const result: unknown = this.evaluateService.evaluateExpression(comb.print);
    this.logger.log(result);
  }
}

