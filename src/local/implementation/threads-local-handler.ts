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


  async* mergeAsyncGenerators(gens: AsyncGenerator<number>[]): AsyncGenerator<number> {
    const results = new Map<number, Promise<IteratorResult<number, void>>>();

    // Initialize all generators
    gens.forEach((gen, index) => {
      results.set(index, gen.next());
    });

    while (results.size > 0) {
      const [index, result] = await Promise.race(
        Array.from(results.entries()).map(
          async([i, p]) => p.then(r => [i, r] as [number, IteratorResult<number, void>])
        )
      );

      if (result.done) {
        results.delete(index);
      } else {
        yield result.value;
        results.set(index, gens[index].next());
      }
    }
  }

  async* execute(
    comb: ThreadsLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    tId: string | undefined |null,
  ): AsyncGenerator<number> {
    const that = this;
    yield* this.mergeAsyncGenerators(
      (comb.threads.map(async function* threadProcess(receiver: Thread, i: number): AsyncGenerator<number> {
        yield* that.semaphoreService.spawnGeneratorChild(
          `th=${receiver.name ??String(i)}`,
          async function* threadGenerator(): AsyncGenerator<number> {
            for (let j = 0; j < receiver.commands.length; j++) {
              yield* that.semaphoreService.spawnGeneratorChild(`c=${String(j)}`, async function* loopGenerator(): AsyncGenerator<number> {
                yield* that.startChain.handle(receiver.commands[j], undefined, undefined, tId);
              });
            }
          }
        );
      }))
    );
  }
}

