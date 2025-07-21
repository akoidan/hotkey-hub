import {Injectable, Logger} from '@nestjs/common';

import {VariableResolutionService} from '@/local/variable-resolution.service';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {DelayService} from '@/local/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {UnkownCommand} from '@/config/types/local-commands';
import {RemoteCommand} from '@/config/types/remote-commands';

@Injectable()
export class CommandLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly variableService: VariableResolutionService,
    private readonly logger: Logger,
    private readonly comandHandler: CommandRemoteHandler,
    private readonly semaphoreService: SemaphorService,
    private readonly delayService: DelayService,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is RemoteCommand {
    return true;
  }

  public async *execute(
    input: RemoteCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined,
  ): AsyncGenerator<void> {
    const currRec: RemoteCommand = this.variableService.replaceEnvVars(input);
    this.logger.debug(`Running ${JSON.stringify(input)}`);
    if (tId) {
      await this.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before', 'command');
      await this.comandHandler.handle(currRec.destination, currRec);
      await this.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after', 'command');
    } else {
      const newTransactionId = this.semaphoreService.getNewTransactionId();
      const that = this;
      yield *this.semaphoreService.spawnChild(`${currRec.destination}-${newTransactionId}`, async function* () {
        try {
          await that.semaphoreService.startTransaction(currRec.destination, newTransactionId);
          await that.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before', 'command');
          await that.comandHandler.handle(currRec.destination, currRec);
          await that.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after', 'command');
        } finally {
          that.semaphoreService.finishTransaction(currRec.destination, newTransactionId);
        }
      });
      yield undefined;
    }
  }
}
