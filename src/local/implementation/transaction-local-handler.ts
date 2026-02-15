import {Injectable, Logger} from '@nestjs/common';
import {DelayService} from '@/local/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {VariableResolutionService} from '@/local/variable-resolution.service';
import {TransactionLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import {Delay} from '@/config/types/remote/base-remote-command';
import {QueueItem} from '@/generator/generator-model';

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
    return (command as TransactionLocalCommand).transaction !== undefined;
  }


  async* execute(
    input: TransactionLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined |null,
  ): AsyncGenerator<QueueItem> {
    const preparedInput = this.variableService.replaceVariables(input);
    if (preparedInput.transaction === null) {
      yield *this.runCommandsGenerator(preparedInput, null, combDelayBefore, combDelayAfter);
      return;
    }
    const tId: string|undefined|null = transactionId ?? this.semaphoreService.getNewTransactionId();
    const that = this;
    yield* this.semaphoreService.spawnGeneratorChild(
      `t=${preparedInput.transaction}=${tId}`,
      // eslint-disable-next-line require-yield
      async function* generatorProcess() {
        try {
          await that.semaphoreService.startTransaction(preparedInput.transaction, tId);
          yield *that.runTransactions(preparedInput, tId, combDelayAfter, combDelayBefore);
        } finally {
          that.semaphoreService.finishTransaction(preparedInput.transaction, tId);
        }
      },
      '='
    );
  }

  private async *runCommandsGenerator(
    preparedInput: TransactionLocalCommand,
    tId: string | undefined | null,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined
  ): AsyncGenerator<QueueItem> {
    if (typeof (preparedInput as Delay).delayBefore === 'number') { // ignore if it's a variable or undefined
      // if it's a macro, delay in this macro won't be passed down
      // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
      yield *this.delayService.awaitDelay((preparedInput as Delay).delayBefore as number, undefined, 'before', `transaction ${tId}`);
    }
    const that = this;
    for (let i = 0; i < preparedInput.commands.length; i++) {
      const delayA = ((preparedInput as Delay).delayAfter as number | undefined) ?? combDelayAfter;
      const delayB = ((preparedInput as Delay).delayBefore as number | undefined) ?? combDelayBefore;
      yield *this.semaphoreService.spawnGeneratorChild(
        `c=${String(i)}`,
        async function* loopGenerator(): AsyncGenerator<QueueItem> { // we shouldn't unpack generator here, so transaction can be finished not paused in the middle to avoid deadlock
          yield* that.startChain.handle(preparedInput.commands[i], delayA, delayB, tId);
        }
      );
    }
    // commands in this macro has been already ran in the loop
    // await delay before the next command after this macro runs
    if (typeof (preparedInput as Delay).delayAfter === 'number') { // ignore if it's a variable or undefined
      yield *this.delayService.awaitDelay((preparedInput as Delay).delayAfter as number, undefined, 'after', `transaction ${tId}`); // if it's a macro, delay in this macro won't be passed down
      // but would be await after all commands in this macro as expected, this is why on top we are not passing it
    }
  }

  private async *runTransactions(
    preparedInput: TransactionLocalCommand,
    tId: string | undefined | null,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined
  ): AsyncGenerator<QueueItem> {
    if (typeof (preparedInput as Delay).delayBefore === 'number') { // ignore if it's a variable or undefined
      // if it's a macro, delay in this macro won't be passed down
      // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
      yield *this.delayService.awaitDelay((preparedInput as Delay).delayBefore as number, undefined, 'before', `transaction ${tId}`);
    }
    const that = this;
    for (let i = 0; i < preparedInput.commands.length; i++) {
      const delayA = ((preparedInput as Delay).delayAfter as number | undefined) ?? combDelayAfter;
      const delayB = ((preparedInput as Delay).delayBefore as number | undefined) ?? combDelayBefore;
      const transactionGenerator = this.semaphoreService.spawnGeneratorChild(
        `c=${String(i)}`,
        async function* loopGenerator(): AsyncGenerator<QueueItem> { // we shouldn't unpack generator here, so transaction can be finished not paused in the middle to avoid deadlock
          yield* that.startChain.handle(preparedInput.commands[i], delayA, delayB, tId);
        }
      );
      for await (const sleepDelay of transactionGenerator) {
        if (sleepDelay) {
          this.logger.debug(`Sleeping for ${sleepDelay}`);
          // eslint-disable-next-line
          await new Promise(resolve => setTimeout(resolve, sleepDelay));
        }
        this.logger.debug('Calling next item from transaction');
      }
    }
    // commands in this macro has been already ran in the loop
    // await delay before the next command after this macro runs
    if (typeof (preparedInput as Delay).delayAfter === 'number') { // ignore if it's a variable or undefined
      yield *this.delayService.awaitDelay((preparedInput as Delay).delayAfter as number, undefined, 'after', `transaction ${tId}`); // if it's a macro, delay in this macro won't be passed down
      // but would be await after all commands in this macro as expected, this is why on top we are not passing it
    }
  }
}
