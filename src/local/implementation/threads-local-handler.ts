import {Injectable, Logger} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {Thread, ThreadsLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';

@Injectable()
export class ThreadsLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly semaphoreService: SemaphorService,
    protected readonly logger: Logger,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is ThreadsLocalCommand {
    return 'threads' in (command as ThreadsLocalCommand);
  }

  async execute(
    comb: ThreadsLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    tId: string | undefined | null,
  ): Promise<void> {
    await Promise.all(comb.threads.map(async(receiver: Thread, i: number): Promise<void> => {
      await this.semaphoreService.spawnPromiseChild(
        `th=${receiver.name ?? String(i)}`,
        async() => {
          for (let j = 0; j < receiver.commands.length; j++) {
            await this.semaphoreService.spawnPromiseChild(
              `c=${String(j)}`,
              async() => {
                await this.startChain.handle(receiver.commands[j], undefined, undefined, tId);
              }
            );
          }
        }
      );
    }));
  }
}

