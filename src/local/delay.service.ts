import {Inject, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {RandomService} from '@/random/random-service';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncLocalStorage} from 'async_hooks';
import {SemaphorService} from '@/semaphor/semaphor-service';

@Injectable()
export class DelayService {
  constructor(
    private readonly configService: ConfigService,
    private readonly randomService: RandomService,
    private readonly logger: Logger,
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
  ) {
  }

  // Awaits delay if specified in global config or in local command data
  // Applies a hugeDelay from global config if chance is succeded
  public async awaitDelay(
    combDelay: undefined | number,
    commandDelay: undefined | number,
    type: 'before' | 'after',
    name: string = '',
  ): Promise<void> {
    const delays = this.configService.getDelays();
    if (commandDelay !== undefined) {
      combDelay = commandDelay;
      if (combDelay && delays.commandDeviation) {
        combDelay = this.randomService.calcDeviation(commandDelay, delays.commandDeviation);
      }
    }

    const configDelay = type === 'before' ? delays.beforeCommand : delays.afterCommand;
    if (combDelay === undefined && configDelay !== undefined) { // TODO I think they are ommited
      combDelay = this.randomService.calcDeviation(configDelay, delays.standardDeviation);
      if (delays.randomHugeDelay && delays.randomHugeDelayChance && Math.random() < delays.randomHugeDelayChance) {
        combDelay += this.randomService.calcDeviation(delays.randomHugeDelay, delays.randomHugeDelayDeviation);
      }
    }
    if (!combDelay) {
      return;
    }
    const controller: AbortController = this.asyncLocalStorage.getStore()!.get(SemaphorService.ABORT_CONTROLLER) as AbortController;
    this.logger.debug(`Sleeping ${type} ${name} for ${combDelay}ms`);
    return new Promise<void>((resolve, reject) => {
      const id = setTimeout(() => {
        this.logger.debug(`Sleep ${combDelay}ms done`);
        resolve();
      }, combDelay);

      controller.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(id);
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(controller.signal.reason ?? new Error('aborted'));
        },
        {once: true}
      );
    });
  }
}
