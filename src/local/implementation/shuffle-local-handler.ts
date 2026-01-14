import {Injectable, Logger} from '@nestjs/common';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {ShuffleLocalCommand, ShufflePolicy, UnknownCommand} from '@/config/types/local/local-commands';
import {SemaphorService} from '@/semaphor/semaphor-service';

@Injectable()
export class ShuffleLocalHandler extends BaseLocalHandler {
  private orders: Record<string, boolean> = {};

  constructor(
    private readonly logger: Logger,
    private readonly sempahoreService: SemaphorService,
  ) {
    super();
  }

  canHandle(command: UnknownCommand): command is ShuffleLocalCommand {
    return Boolean((command as ShuffleLocalCommand).shuffle);
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr]; // make a shallow copy
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]]; // swap
    }
    return copy;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      // eslint-disable-next-line
      hash = (str.charCodeAt(i) + hash * 31) | 0; // keep 32-bit integer
    }
    // eslint-disable-next-line
    return hash >>> 0; // make it unsigned
  }

  async* execute(
    comb: ShuffleLocalCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined,
  ): AsyncGenerator<void> {
    let array = comb.commands;
    if (comb.shuffle === ShufflePolicy.random) {
      array = this.shuffleArray(array);
    } else if (comb.shuffle === ShufflePolicy.reverse) {
      const key = JSON.stringify(comb);
      this.hashString(key);
      this.orders[key] = !(this.orders[key] ?? false);
      if (this.orders[key]) {
        array = array.reverse();
      }
    }
    for (const command of array) {
      const index = comb.commands.indexOf(command);
      this.logger.debug(`Running ${index} iteration`);
      const that = this;
      yield* this.sempahoreService.spawnGeneratorChild(`s=${String(index)}`, async function* loopGenerator(): AsyncGenerator<void> {
        yield* that.startChain.handle(command, undefined, undefined, tId);
      });
    }
  }
}

