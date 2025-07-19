import {Injectable} from '@nestjs/common';
import {DelayService} from '@/logic/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/logic/implementation/base-local-handler';
import {VariableResolutionService} from '@/logic/variable-resolution.service';
import {TransactionLocalCommand, UnkownCommand} from '@/config/types/local-commands';

@Injectable()
export class TransactionLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly semaphoreService: SemaphorService,
    private readonly delayService: DelayService,
    private readonly variableService: VariableResolutionService,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is TransactionLocalCommand {
    return Boolean((command as TransactionLocalCommand).transaction);
  }


  async execute(
    input: TransactionLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): Promise<void> {
    const preparedInput = this.variableService.replaceEnvVars(input);
    const tId = transactionId ?? this.semaphoreService.getNewTransactionId();
    await this.semaphoreService.spawnChild(`${preparedInput.transaction}-${tId}`, async() => {
      try {
        await this.semaphoreService.startTransaction(preparedInput.transaction, tId);
        if (typeof preparedInput.delayBefore === 'number') { // ignore if it's a variable or undefined
          // if it's a macro, delay in this macro won't be passed down
          // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
          await this.delayService.awaitDelay(preparedInput.delayBefore as number, undefined, 'before', `transaction ${tId}`);
        }
        for (const command of preparedInput.commands) {
          const delayA = (command.delayAfter as number | undefined) ?? combDelayAfter;
          const delayB = (command.delayBefore as number | undefined) ?? combDelayBefore;
          await this.startChain.handle(command, delayA, delayB, tId);
        }
        // commands in this macro has been already ran in the loop
        // await delay before the next command after this macro runs
        if (typeof preparedInput.delayAfter === 'number') { // ignore if it's a variable or undefined
          await this.delayService.awaitDelay(preparedInput.delayAfter as number, undefined, 'after', `transaction ${tId}`); // if it's a macro, delay in this macro won't be passed down
          // but would be await after all commands in this macro as expected, this is why on top we are not passing it
        }
      } finally {
        this.semaphoreService.finishTransaction(preparedInput.transaction, tId);
      }
    });
  }
}
