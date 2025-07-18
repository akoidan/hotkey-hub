import {Injectable, Logger} from '@nestjs/common';
import {Command} from '@/config/types/commands';
import {VariableResolutionService} from '@/logic/variable-resolution.service';
import {CommandHandler} from '@/handlers/command-handler.service';
import {DelayService} from '@/logic/delay.service';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseProcessingService} from '@/logic/implementation/base-processing.service';
import {UnkownCommand} from '@/config/types/macros';

@Injectable()
export class CommandProcessingService extends BaseProcessingService {
  constructor(
    private readonly variableService: VariableResolutionService,
    private readonly logger: Logger,
    private readonly comandHandler: CommandHandler,
    private readonly semaphoreService: SemaphorService,
    private readonly delayService: DelayService,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is Command {
    return true;
  }

  public async execute(
    input: Command,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined,
  ): Promise<void> {
    const currRec = this.variableService.replaceEnvVars(input);
    this.logger.debug(`Running ${JSON.stringify(input)}`);
    if (tId) {
      await this.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before');
      await this.comandHandler.handle((currRec as Command).destination, currRec);
      await this.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after');
    } else {
      const newTransactionId = this.semaphoreService.getNewTransactionId();
      await this.semaphoreService.spawnChild(newTransactionId, async() => {
        try {
          await this.semaphoreService.startTransaction((currRec as Command).destination, newTransactionId);
          await this.delayService.awaitDelay(combDelayBefore, input.delayBefore as number | undefined, 'before');
          await this.comandHandler.handle((currRec as Command).destination, currRec);
          await this.delayService.awaitDelay(combDelayAfter, input.delayAfter as number | undefined, 'after');
        } finally {
          this.semaphoreService.finishTransaction((currRec as Command).destination, newTransactionId);
        }
      });
    }
  }
}
