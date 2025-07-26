import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {LoopLocalCOmmand, ThreadsLocalCommand, UnkownCommand} from '@/config/types/local-commands';
import clc from "cli-color";

@Injectable()
export class LoopLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is LoopLocalCOmmand {
    return Boolean((command as LoopLocalCOmmand).loop);
  }

  async* execute(
    comb: LoopLocalCOmmand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): AsyncGenerator<void> {
    for (let i = 1; comb.loop < 0 || i < comb.iterations; i++) {
      this.logger.debug(`Running ${clc.yellow(i)} iteration of ${clc.bold.green(comb.name)}`);
      for (const command of comb.commands!) {
        yield *this.startChain.handle(command, comb.delayAfter, comb.delayBefore, undefined);
      }
    }
  }
}

