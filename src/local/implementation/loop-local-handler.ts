/* eslint-disable*/
import {Injectable, Logger} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {LoopLocalCOmmand, ThreadsLocalCommand, UnkownCommand} from '@/config/types/local-commands';
import clc from "cli-color";

@Injectable()
export class LoopLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly semaphorService: SemaphorService,
    private readonly logger: Logger,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is LoopLocalCOmmand {
    return Boolean((command as LoopLocalCOmmand).loop);
  }

  async* execute(
    comb: ThreadsLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): AsyncGenerator<void> {
    for (let i = 1; comb.iterations < 0 || i < comb.iterations; i++) {
      this.logger.log(`Running ${clc.yellow(i)} iteration of ${clc.bold.green(comb.name)}`);
      for (const command of comb.commands!) {
        let j = 0;
        const flow = this.startChain.handle(command, comb.delayAfter, comb.delayBefore, undefined);
        while (true) {
          const {done} = await flow.next();
          this.logger.log(`Stepping into ${clc.yellow(j++)} command`)
          if (done) {
            break
          }
        }
      }
    }
  }

