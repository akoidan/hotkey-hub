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
        for await (const operation of this.unkownCommandProcessor.handle(command, comb.delayAfter, comb.delayBefore, undefined)) {
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const copy: Shortcut = JSON.parse(JSON.stringify(comb));
      delete copy.iterations;
      for (let i = 1; this.iterationsInProgress[comb.shortCut]; i++) {
        if (comb.iterations! > 0 && comb.iterations! < i) {
          this.iterationsInProgress[comb.shortCut] = false;
          break;
        }
        this.logger.log(`Running ${clc.yellow(i)} iteration of ${clc.bold.green(comb.name)}`);
        for (const command of comb.commands!) {
          let i = 0;
          const flow = this.unkownCommandProcessor.handle(command, comb.delayAfter, comb.delayBefore, undefined);
          while (true) {
            const {done} = await flow.next();
            this.logger.log(`Stepping into ${clc.yellow(i++)} iteration`)
            if (done) {
              break
            }
            if (!this.iterationsInProgress[comb.shortCut]) {
              this.logger.log(`Termination flow ${clc.bold.green(comb.name)}.`);
              return;
            }
          }
        }
      }
      this.iterationsInProgress[comb.shortCut] = false;
      this.logger.log(`Finished flow ${clc.bold.green(comb.name)}`);
    }
  }
}