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
    if (comb.pausable && this.iterationsInProgress[comb.shortCut]) {
      this.iterationsInProgress[comb.shortCut] = false;
      this.logger.log(`Halting ${clc.bold.green(comb.name)}. Waiting for its command to finish...`);
    } else {
      this.iterationsInProgress[comb.shortCut] = true;
      for (const command of comb.commands!) {
        const generator = this.unkownCommandProcessor.handle(command, comb.delayAfter, comb.delayBefore, undefined);
        let i = 0;
        while (true) {
          const {done} = await generator.next();
          if (done) {
            this.logger.log(`Finished flow ${clc.bold.green(comb.name)}`);
            break;
          }
          this.logger.debug(`Opration ${clc.bold.green(i++)} finished.`);
          if (comb.pausable && !this.iterationsInProgress[comb.shortCut]) {
            this.logger.log(`Terminating ${clc.bold.green(comb.name)}.`);
            // await return is not required, we just skip calling next
            // also return is not technicaly correct cause we are mearing multiple generators in one manually in thread-local-handler
            // await generator.return(undefined);
            return;
          }
        }
      }
    }
  }
}