/* eslint-disable*/
import {Injectable, Logger} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {ThreadLocalArray, ThreadsLocalCommand, UnkownCommand} from '@/config/types/local-commands';

@Injectable()
export class ThreadsLocalHandler extends BaseLocalHandler {
  constructor(
    private readonly semaphorService: SemaphorService,
    private readonly logger: Logger,
  ) {
    super();
  }

  canHandle(command: UnkownCommand): command is ThreadsLocalCommand {
    return Boolean((command as ThreadsLocalCommand).threads);
  }


  async* mergeAsyncGenerators(gens: AsyncGenerator<void>[]): AsyncGenerator<void> {
    const results = new Map<number, Promise<IteratorResult<void, void>>>();
    
    // Initialize all generators
    gens.forEach((gen, index) => {
      results.set(index, gen.next());
    });
    
    while (results.size > 0) {
      const [index, result] = await Promise.race(
        Array.from(results.entries()).map(
          ([i, p]) => p.then(r => [i, r] as [number, IteratorResult<void, void>])
        )
      );
      
      if (result.done) {
        results.delete(index);
      } else {
        yield undefined;
        results.set(index, gens[index].next());
      }
    }
  }

  async* execute(
    comb: ThreadsLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    transactionId: string | undefined,
  ): AsyncGenerator<void> {
    const that = this;
    yield *this.mergeAsyncGenerators((comb.threads.map(async function* (receiver: ThreadLocalArray, i: number): AsyncGenerator<void> {
      yield *that.semaphorService.spawnGeneratorChild(String(i), async function* (): AsyncGenerator<void> {
        for (const command of receiver) {
          yield *that.startChain.handle(command, undefined, undefined, transactionId);
        }
      });
    })));
  }
}

