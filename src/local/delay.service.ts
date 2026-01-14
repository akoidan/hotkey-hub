import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {RandomService} from '@/random/random-service';

@Injectable()
export class DelayService {
  constructor(
    private readonly configService: ConfigService,
    private readonly randomService: RandomService,
    private readonly logger: Logger,
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
    if (combDelay === undefined && configDelay !== undefined) {
      combDelay = this.randomService.calcDeviation(configDelay, delays.standardDeviation);
      if (delays.randomHugeDelay && delays.randomHugeDelayChance && Math.random() < delays.randomHugeDelayChance) {
        combDelay += this.randomService.calcDeviation(delays.randomHugeDelay, delays.randomHugeDelayDeviation);
      }
    }
    if (!combDelay) {
      return;
    }
    this.logger.debug(`Sleeping ${type} ${name} for ${combDelay}ms`);
    await new Promise(resolve => {
      setTimeout(resolve, combDelay);
    });
  }
}
