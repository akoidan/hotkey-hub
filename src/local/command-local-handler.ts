import {Injectable, Logger} from '@nestjs/common';

import {VariableResolutionService} from '@/local/variable-resolution.service';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {DelayService} from '@/local/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {RemoteCommand} from '@/config/types/remote/remote-commands';

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
  ): AsyncGenerator<void> {
    const currRec: RemoteCommand = this.variableService.replaceVariables(input);
    this.logger.debug(`Running ${JSON.stringify(input)}`);
    if (tId !== undefined) { // eslint-disable-line no-negated-condition
      await this.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before', 'command');
      await this.comandHandler.handle(currRec.destination as string, currRec);
      await this.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after', 'command');
    } else {
      const newTransactionId = this.semaphoreService.getNewTransactionId();
      await this.semaphoreService.spawnPromiseChild(`d=${newTransactionId}`, async() => {
        try {
          await this.semaphoreService.startTransaction(currRec.destination as string, newTransactionId);
          await this.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before', 'command');
          await this.comandHandler.handle(currRec.destination as string, currRec);
          await this.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after', 'command');
        } finally {
          this.semaphoreService.finishTransaction(currRec.destination as string, newTransactionId);
        }
      }, '=');
      yield undefined;
    }
  }
}
