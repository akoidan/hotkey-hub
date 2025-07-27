import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {LoopLocalCommand, ThreadsLocalCommand, UnkownCommand} from '@/config/types/local-commands';
import clc from "cli-color";

@Injectable()
export class LoopLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is LoopLocalCommand {
    return Boolean((command as LoopLocalCommand).loop);
  }

  async* execute(
    comb: LoopLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): AsyncGenerator<void> {
    for (let i = 0; comb.loop < 0 || i < comb.loop; i++) {
      this.logger.debug(`Running ${clc.yellow(i+1)} iteration`);
      for (const command of comb.commands!) {
        yield *this.startChain.handle(command, undefined, undefined, undefined);
      }
    }
  }
}

