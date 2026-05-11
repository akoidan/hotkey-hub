import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {UnknownCommand} from '@/config/types/commands';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {ExceptionLocalCommand} from '@/config/types/local/exception-local-command';

@Injectable()
export class ExceptionLocalHandler extends BaseLocalHandler {
  constructor(
    protected readonly logger: Logger,
    private readonly semaphoreService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is ExceptionLocalCommand {
    return 'try' in command;
  }

  async execute(
    cmd: ExceptionLocalCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined |null,
  ): Promise<void> {
        try {
      this.logger.debug('Spawing try block ');
      for (let i = 0; i < cmd.try.length; i++) {
        await this.semaphoreService.spawnPromiseChild(`try=${String(i)}`, async() => {
          await this.startChain.handle(cmd.try[i], undefined, undefined, tId);
        });
      }
    } catch (e: any) {
      this.logger.error(`Try block failed with error ${e.message || e}`, (e as Error).stack);
      if (cmd.catch) {
        this.logger.debug('Spawing catch block ');
        for (let i = 0; i < cmd.catch.length; i++) {
          await this.semaphoreService.spawnPromiseChild(`catch=${String(i)}`, async() => {
            await this.startChain.handle(cmd.catch![i], undefined, undefined, tId);
          });
        }
      }
    } finally {
      if (cmd.finally) {
        this.logger.debug('Spawing finally block ');
        for (let i = 0; i < cmd.finally.length; i++) {
          await this.semaphoreService.spawnPromiseChild(`finally=${String(i)}`, async() => {
            await this.startChain.handle(cmd.finally![i], undefined, undefined, tId);
          });
        }
      }
    }
  }
}
