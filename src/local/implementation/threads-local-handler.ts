import {Injectable, Logger} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {Thread, ThreadsLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';

@Injectable()
export class ThreadsLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly semaphoreService: SemaphorService,
    private readonly logger: Logger,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is ThreadsLocalCommand {
    return Boolean((command as ThreadsLocalCommand).threads);
  }


  async mergeAsyncGenerators(gens: Promise<void>[]): Promise<void> {
    // Since we're converting from generators to async functions,
    // we just need to await all promises in parallel
    await Promise.all(gens);
  }

  async execute(
    comb: ThreadsLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    tId: string | undefined | null,
  ): Promise<void> {
    const that = this;
    await this.mergeAsyncGenerators(
      (comb.threads.map(async function threadProcess(receiver: Thread, i: number): Promise<void> {
        await that.semaphoreService.spawnPromiseChild(
          `th=${receiver.name ?? String(i)}`,
          async function threadGenerator(): Promise<void> {
            for (let j = 0; j < receiver.commands.length; j++) {
              await that.semaphoreService.spawnPromiseChild(
                `c=${String(j)}`,
                async function loopGenerator(): Promise<void> {
                  await that.startChain.handle(receiver.commands[j], undefined, undefined, tId);
                }
              );
            }
          }
        );
      }))
    );
  }
}

