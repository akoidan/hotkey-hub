import {Injectable, Logger} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {Thread, ThreadsLocalCommand} from '@/config/types/local/local-commands';
import {UnknownCommand} from '@/config/types/commands';
import {QueueItem} from '@/generator/generator-model';

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


  async* mergeAsyncGenerators(gens: Promise<void>[]): Promise<void> {
    const results = new Map<number, Promise<IteratorResult<QueueItem, void>>>();

    // Initialize all generators
    gens.forEach((gen, index) => {
      results.set(index, gen.next());
    });

    while (results.size > 0) {
      const [index, result] = await Promise.race(
        Array.from(results.entries()).map(
          async([i, p]) => p.then(r => [i, r] as [number, IteratorResult<QueueItem, void>])
        )
      );

      if (result.done) {
        results.delete(index);
      } else {
        if (typeof result.value === 'number') {
          yield {
            sleep: result.value,
            id: String(index),
          };
        } else if (result.value) {
          yield {
            sleep: result.value.sleep,
            id: `${index}-${result.value.id}`,
          };
        } else {
          throw Error('Unknown result value');
        }
        results.set(index, gens[index].next());
      }
    }
  }

  async* execute(
    comb: ThreadsLocalCommand,
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined,
    tId: string | undefined | null,
  ): Promise<void> {
    const that = this;
    yield* this.mergeAsyncGenerators(
      (comb.threads.map(async function* threadProcess(receiver: Thread, i: number): Promise<void> {
        yield* that.semaphoreService.spawnPromiseChild(
          `th=${receiver.name ?? String(i)}`,
          async function* threadGenerator(): Promise<void> {
            for (let j = 0; j < receiver.commands.length; j++) {
              yield* that.semaphoreService.spawnPromiseChild(
                `c=${String(j)}`,
                async function* loopGenerator(): Promise<void> {
                  yield* that.startChain.handle(receiver.commands[j], undefined, undefined, tId);
                }
              );
            }
          }
        );
      }))
    );
  }
}

