import {Injectable, Logger} from '@nestjs/common';
import {DelayService} from '@/local/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {VariableResolutionService} from '@/local/variable-resolution.service';
import {TransactionLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import {Delay} from '@/config/types/remote/base-remote-command';

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


  async execute(
    input: TransactionLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined |null,
  ): Promise<void> {
    const preparedInput = this.variableService.replaceVariables(input);
    if (preparedInput.transaction === null) {
      await this.runCommands(preparedInput, null, combDelayBefore, combDelayAfter);
      return;
    }
    const tId: string|undefined|null = transactionId ?? this.semaphoreService.getNewTransactionId();
        await this.semaphoreService.spawnPromiseChild(
      `t=${preparedInput.transaction}=${tId}`,
      async() => {
        try {
          await this.semaphoreService.startTransaction(preparedInput.transaction, tId);
          await this.runTransactions(preparedInput, tId, combDelayAfter, combDelayBefore);
        } finally {
          this.semaphoreService.finishTransaction(preparedInput.transaction, tId);
        }
      },
      '='
    );
  }

  private async runCommands(
    preparedInput: TransactionLocalCommand,
    tId: string | undefined | null,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined
  ): Promise<void> {
    if (typeof (preparedInput as Delay).delayBefore === 'number') { // ignore if it's a variable or undefined
      // if it's a macro, delay in this macro won't be passed down
      // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
      await this.delayService.awaitDelay(
        (preparedInput as Delay).delayBefore as number,
        undefined,
        'before',
        `transaction ${tId}`
      );
    }
        for (let i = 0; i < preparedInput.commands.length; i++) {
      const delayA = ((preparedInput as Delay).delayAfter as number | undefined) ?? combDelayAfter;
      const delayB = ((preparedInput as Delay).delayBefore as number | undefined) ?? combDelayBefore;
      await this.semaphoreService.spawnPromiseChild(
        `c=${String(i)}`,
        async() => { // we shouldn't unpack generator here, so transaction can be finished not paused in the middle to avoid deadlock
          await this.startChain.handle(preparedInput.commands[i], delayA, delayB, tId);
        }
      );
    }
    // commands in this macro has been already ran in the loop
    // await delay before the next command after this macro runs
    if (typeof (preparedInput as Delay).delayAfter === 'number') { // ignore if it's a variable or undefined
      await this.delayService.awaitDelay(
        (preparedInput as Delay).delayAfter as number,
        undefined,
        'after',
        `transaction ${tId}`
      ); // if it's a macro, delay in this macro won't be passed down
      // but would be await after all commands in this macro as expected, this is why on top we are not passing it
    }
  }

  private async runTransactions(
    preparedInput: TransactionLocalCommand,
    tId: string | undefined | null,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined
  ): Promise<void> {
    if (typeof (preparedInput as Delay).delayBefore === 'number') { // ignore if it's a variable or undefined
      // if it's a macro, delay in this macro won't be passed down
      // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
      await this.delayService.awaitDelay(
        (preparedInput as Delay).delayBefore as number,
        undefined,
        'before',
        `transaction ${tId}`
      );
    }
        for (let i = 0; i < preparedInput.commands.length; i++) {
      const delayA = ((preparedInput as Delay).delayAfter as number | undefined) ?? combDelayAfter;
      const delayB = ((preparedInput as Delay).delayBefore as number | undefined) ?? combDelayBefore;
      const transactionPromise = this.semaphoreService.spawnPromiseChild(
        `c=${String(i)}`,
        async() => { // we shouldn't unpack generator here, so transaction can be finished not paused in the middle to avoid deadlock
          await this.startChain.handle(preparedInput.commands[i], delayA, delayB, tId);
        }
      );
      await transactionPromise;
      this.logger.debug('Calling next item from transaction');
    }
    // commands in this macro has been already ran in the loop
    // await delay before the next command after this macro runs
    if (typeof (preparedInput as Delay).delayAfter === 'number') { // ignore if it's a variable or undefined
      await this.delayService.awaitDelay(
        (preparedInput as Delay).delayAfter as number,
        undefined,
        'after',
        `transaction ${tId}`
      ); // if it's a macro, delay in this macro won't be passed down
      // but would be await after all commands in this macro as expected, this is why on top we are not passing it
    }
  }
}
