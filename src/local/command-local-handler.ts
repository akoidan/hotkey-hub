import {Injectable, Logger} from '@nestjs/common';

import {VariableResolutionService} from '@/local/variable-resolution.service';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {DelayService} from '@/local/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {QueueItem} from '@/generator/generator-model';

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

  canHandle(command: RemoteCommand): command is RemoteCommand {
    return Boolean(command.performOnRemote);
  }

  public async *execute(
    input: RemoteCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined|null,
  ): AsyncGenerator<QueueItem> {
    const currRec: RemoteCommand = this.variableService.replaceVariables(input);
    this.logger.debug(`Running ${JSON.stringify(input)}`);
    // if transaction is null = disabled. If transaction is string = already created on parent stack
    if (tId !== undefined) { // eslint-disable-line no-negated-condition
      yield *this.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before', 'command');
      await this.comandHandler.handle(currRec.destination as string, currRec);
      yield *this.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after', 'command');
    } else {
      const newTransactionId = this.semaphoreService.getNewTransactionId();
      const that = this;
      yield* this.semaphoreService.spawnGeneratorChild(`d=${newTransactionId}`, async function* loopGenerator(): AsyncGenerator<QueueItem> {
        try {
          await that.semaphoreService.startTransaction(currRec.destination as string, newTransactionId);
          yield *that.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before', 'command');
          await that.comandHandler.handle(currRec.destination as string, currRec);
          yield *that.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after', 'command');
        } finally {
          that.semaphoreService.finishTransaction(currRec.destination as string, newTransactionId);
        }
      }, '=');
      yield 0;
    }
  }
}
