import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {UnknownCommand} from '@/config/types/commands';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {ExceptionLocalCommand} from '@/config/types/local/exception-local-command';

@Injectable()
export class ExceptionLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly logger: Logger,
    private readonly semaphoreService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is ExceptionLocalCommand {
    return (command as ExceptionLocalCommand).try !== undefined;
  }

  async* execute(
    cmd: ExceptionLocalCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined,
  ): AsyncGenerator<void> {
    const that = this;
    try {
      this.logger.debug('Spawing try block ');
      for (let i = 0; i < cmd.try.length; i++) {
        yield* this.semaphoreService.spawnGeneratorChild(`try=${String(i)}`, async function* loopGenerator(): AsyncGenerator<void> {
          yield* that.startChain.handle(cmd.try[i], undefined, undefined, tId);
        });
      }
    } catch (e) {
      this.logger.error(`Try block failed with error ${e.message || e}`, (e as Error).stack);
      if (cmd.catch) {
        this.logger.debug('Spawing catch block ');
        for (let i = 0; i < cmd.catch.length; i++) {
          yield* this.semaphoreService.spawnGeneratorChild(`catch=${String(i)}`, async function* loopGenerator(): AsyncGenerator<void> {
            yield* that.startChain.handle(cmd.catch![i], undefined, undefined, tId);
          });
        }
      }
    } finally {
      if (cmd.finally) {
        this.logger.debug('Spawing finally block ');
        for (let i = 0; i < cmd.finally.length; i++) {
          yield* this.semaphoreService.spawnGeneratorChild(`finally=${String(i)}`, async function* loopGenerator(): AsyncGenerator<void> {
            yield* that.startChain.handle(cmd.finally![i], undefined, undefined, tId);
          });
        }
      }
    }
  }
}
