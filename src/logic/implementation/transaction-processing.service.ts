import {Injectable} from '@nestjs/common';
import {TransactionCommand, UnkownCommand} from '@/config/types/macros';
import {DelayService} from '@/logic/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseProcessingService} from '@/logic/implementation/base-processing.service';

@Injectable()
export class TransactionProcessingService extends BaseProcessingService {
  constructor(
    private readonly semaphoreService: SemaphorService,
    private readonly delayService: DelayService,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is TransactionCommand {
    return Boolean((command as TransactionCommand).transaction);
  }


  async execute(
    input: TransactionCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): Promise<void> {
    if (typeof input.delayBefore === 'number') { // ignore if it's a variable or undefined
      // if it's a macro, delay in this macro won't be passed down
      // but would be await after any commands in this macro has run yet as expected, this is why on top we are not passing it
      await this.delayService.awaitDelay(input.delayBefore as number, undefined, 'before');
    }
    const tId = transactionId ?? this.semaphoreService.getNewTransactionId();
    for (const command of input.commands) {
      const delayA = (command.delayAfter as number | undefined) ?? combDelayAfter;
      const delayB = (command.delayBefore as number | undefined) ?? combDelayBefore;

      await this.semaphoreService.spawnChild(input.transaction, async() => {
        try {
          await this.semaphoreService.startTransaction(input.transaction, tId);
          await this.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before');
          await this.startChain.handle(command, delayA, delayB, tId);
          await this.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after');
        } finally {
          this.semaphoreService.finishTransaction(input.transaction, tId);
        }
      });
    }
    // commands in this macro has been already ran in the loop
    // await delay before the next command after this macro runs
    if (typeof input.delayAfter === 'number') { // ignore if it's a variable or undefined
      await this.delayService.awaitDelay(input.delayAfter as number, undefined, 'after'); // if it's a macro, delay in this macro won't be passed down
      // but would be await after all commands in this macro as expected, this is why on top we are not passing it
    }
  }
}
