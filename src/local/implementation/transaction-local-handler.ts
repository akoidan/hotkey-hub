import {Injectable, Logger} from '@nestjs/common';
import {DelayService} from '@/local/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {VariableResolutionService} from '@/local/variable-resolution.service';
import {TransactionLocalCommand, UnknownCommand} from '@/config/types/local-commands';
import {Delay} from '@/config/types/remote-commands';

@Injectable()
export class TransactionLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly semaphoreService: SemaphorService,
    private readonly delayService: DelayService,
    private readonly variableService: VariableResolutionService,
    private readonly logger: Logger,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is TransactionLocalCommand {
    return Boolean((command as TransactionLocalCommand).transaction);
  }


  async* execute(
    input: TransactionLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): AsyncGenerator<void> {
    const preparedInput = this.variableService.replaceEnvVars(input);
    const tId = transactionId ?? this.semaphoreService.getNewTransactionId();
    const that = this;
    yield* this.semaphoreService.spawnGeneratorChild(`${preparedInput.transaction}-${tId}`, async function* generatorProcess() {
      try {
        await that.semaphoreService.startTransaction(preparedInput.transaction, tId);
        if (typeof (preparedInput as Delay).delayBefore === 'number') { // ignore if it's a variable or undefined
          // if it's a macro, delay in this macro won't be passed down
          // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
          await that.delayService.awaitDelay((preparedInput as Delay).delayBefore as number, undefined, 'before', `transaction ${tId}`);
        }
        for (let i = 0; i < preparedInput.commands.length; i++) {
          const delayA = ((preparedInput as Delay).delayAfter as number | undefined) ?? combDelayAfter;
          const delayB = ((preparedInput as Delay).delayBefore as number | undefined) ?? combDelayBefore;
          const transactionGenerator = that.semaphoreService.spawnGeneratorChild(
            String(i),
            async function* loopGenerator(): AsyncGenerator<void> { // we shouldn't unpack generator here, so transaction can be finished not paused in the middle to avoid deadlock
              yield* that.startChain.handle(preparedInput.commands[i], delayA, delayB, tId);
            }
          );
          for await (const _ of transactionGenerator) {
            that.logger.debug('Calling next item on generator');
          }
        }
        // commands in this macro has been already ran in the loop
        // await delay before the next command after this macro runs
        if (typeof (preparedInput as Delay).delayAfter === 'number') { // ignore if it's a variable or undefined
          await that.delayService.awaitDelay((preparedInput as Delay).delayAfter as number, undefined, 'after', `transaction ${tId}`); // if it's a macro, delay in this macro won't be passed down
          // but would be await after all commands in this macro as expected, this is why on top we are not passing it
        }
      } finally {
        that.semaphoreService.finishTransaction(preparedInput.transaction, tId);
      }
    });
  }
}
