/* eslint-disable*/
import {Injectable, Logger} from '@nestjs/common';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {ThreadLocalCommand, ThreadsLocalCommand, UnkownCommand} from '@/config/types/local-commands';

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


  async* mergeAsyncGenerators(gens:AsyncGenerator<void>[]) {
    const active = gens.map((gen, i) => ({gen: gen, index: i}));
    const running = new Map(); // Map index -> pending Promise

    // Kick off initial .next() for all generators
    for (const {gen, index} of active) {
      running.set(index, gen.next().then(res => ({...res, index, gen})));
    }

    while (running.size > 0) {
      // Wait for the next generator that yields
      const nextResult = await Promise.race(running.values());

      const {value, done, index, gen} = nextResult;

      if (done) {
        running.delete(index);
      } else {
        yield {thread: index, value};
        // Schedule the next .next() from this generator
        running.set(index, gen.next().then((res: any) => ({...res, index, gen})));
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
    for await (const {
      thread,
      value,
    } of this.mergeAsyncGenerators((comb.threads.map(async function* (receiver: ThreadLocalCommand, i: number): AsyncGenerator<void> {
      that.logger.debug("Yielding from threadlocal 1");
      yield *that.semaphorService.spawnChild(String(i), async function* (): AsyncGenerator<void> {
        for (const command of receiver) {
          that.logger.debug("Yielding from threadlocal 2");
          yield *that.startChain.handle(command, undefined, undefined, transactionId);
        }
      });
    })))) {

    };
  }
}

