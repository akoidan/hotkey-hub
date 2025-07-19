import {Injectable, Logger} from '@nestjs/common';
import clc from 'cli-color';
import {BaseLocalHandler} from '@/logic/implementation/base-local-handler';
import {Shortcut} from '@/config/types/shortcut';
import {UnkownCommand} from '@/config/types/local-commands';

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
      await this.runCommands(comb.commands!, comb.delayAfter, comb.delayBefore);
    } else  {
      await this.runLoop(comb);
    }
  }

  private async runLoop(comb: Shortcut): Promise<void> {
    if (this.iterationsInProgress[comb.shortCut]) {
      this.iterationsInProgress[comb.shortCut] = false;
      this.logger.log(`Halting ${clc.bold.green(comb.name)}. Waiting for its command to finish...`);
    } else {
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
        await this.runShortcut(copy);
      }
    }
  }

  private async runCommands(
    commands: UnkownCommand[],
    combDelayAfter: number | undefined,
    combDelayBefore: number | undefined
  ): Promise<void> {
    for (const command of commands) {
      await this.unkownCommandProcessor.handle(command, combDelayAfter, combDelayBefore, undefined);
    }
  }
}
