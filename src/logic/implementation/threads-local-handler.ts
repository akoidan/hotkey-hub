import {Injectable} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/logic/implementation/base-local-handler';
import {ThreadLocalCommand, ThreadsLocalCommand, UnkownCommand} from '@/config/types/local-commands';

@Injectable()
export class ThreadsLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly semaphorService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is ThreadsLocalCommand {
    return Boolean((command as ThreadsLocalCommand).threads);
  }

  async execute(
    comb: ThreadsLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): Promise<void> {
    /* eslint-disable */
    await Promise.all(comb.threads.map((receiver: ThreadLocalCommand, i: number): Promise<void> => {
      return this.semaphorService.spawnChild(String(i), async (): Promise<void> => {
        for (const command of receiver) {
          await this.startChain.handle(command, undefined, undefined, transactionId);
        }
      });
    }));
    /* eslint-enable */
  }
}

