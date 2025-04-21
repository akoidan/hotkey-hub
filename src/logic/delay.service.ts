import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';

@Injectable()
export class DelayService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {

  }

  /**
   * Generates a random number based on a given value x and a deviation factor d, where the result stays within the range x ± d * x.
   */
  private calcDiviation(x: number, d?: number): number {
    if (d) {
      const randomVariator = 1 + ((2 * Math.random() - 1) * d);
      return Math.round(x * randomVariator);
    }
    return x;
  }

  // Awaits delay if specified in global config or in local command data
  // Applies a hugeDelay from global config if chance is succeded
  public async awaitDelay(
    combDelay: undefined | number,
    commandDelay: undefined | number,
    type: 'before' | 'after'
  ): Promise<void> {
    if (commandDelay !== undefined) {
      combDelay = commandDelay;
    }

    const delays = this.configService.getDelays();
    const configDelay = type === 'before' ? delays.beforeCommand : delays.afterCommand;
    if (combDelay === undefined && configDelay !== undefined) {
      combDelay = this.calcDiviation(configDelay, delays.standardDiviation);
      if (delays.randomHugeDelay && delays.randomHugeDelayChance && Math.random() < delays.randomHugeDelayChance) {
        combDelay += this.calcDiviation(delays.randomHugeDelay, delays.randomHugeDelayDiviation);
      }
    }
    if (!combDelay) {
      return;
    }
    this.logger.debug(`Sleeping for ${combDelay}ms`);
    await new Promise(resolve => {
      setTimeout(resolve, combDelay);
    });
  }
}
