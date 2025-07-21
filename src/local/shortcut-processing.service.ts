import {Injectable, Logger} from '@nestjs/common';
import clc from 'cli-color';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {Shortcut} from '@/config/types/shortcut';

@Injectable()
export class ShortcutProcessingService {
  private iterationsInProgress: Record<string, boolean> = {};

  constructor(
    private readonly unkownCommandProcessor: BaseLocalHandler,
    private readonly logger: Logger,
  ) {
  }

  async runShortcut(comb: Shortcut): Promise<void> {
    if (typeof comb.iterations === 'undefined') {

      for (const command of comb.commands!) {
        this.unkownCommandProcessor.handle(command, comb.delayAfter, comb.delayBefore, undefined)
        for await (const operation of ) {
        }
      }
    } else {
      await this.runLoop(comb);
    }
  }

  private async runLoop(comb: Shortcut): Promise<void> {
    if (this.iterationsInProgress[comb.shortCut]) {
      this.iterationsInProgress[comb.shortCut] = false;
      this.logger.log(`Halting ${clc.bold.green(comb.name)}. Waiting for its command to finish...`);
    } else {
      this.logger.log(`Starting flow ${clc.bold.green(comb.name)}`);
      this.iterationsInProgress[comb.shortCut] = true;

      }
      this.iterationsInProgress[comb.shortCut] = false;
      this.logger.log(`Finished flow ${clc.bold.green(comb.name)}`);
    }
  }
}