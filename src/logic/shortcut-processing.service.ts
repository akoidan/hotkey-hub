import {Injectable, Logger} from '@nestjs/common';
import {MacroShortcutMapping, ShortsData} from '@/config/types/shortcut';
import {UnkownCommand} from '@/config/types/macros';
import clc from 'cli-color';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {BaseProcessingService} from '@/logic/implementation/base-processing.service';

@Injectable()
export class ShortcutProcessingService {
  private iterationsInProgress: Record<string, boolean> = {};

  constructor(
    private readonly unkownCommandProcessor: BaseProcessingService,
    private readonly logger: Logger,
    private readonly semaphorService: SemaphorService,
  ) {
  }

  async runShortcut(comb: ShortsData): Promise<void> {
    if (typeof comb.iterations !== 'undefined') {
      await this.runLoop(comb);
    } else if ((comb as MacroShortcutMapping).threads) {
      await Promise.all((comb as MacroShortcutMapping).threads!.map(async(receiver, i) => new Promise((resolv, rej) => {
        this.semaphorService.spawnChild(String(i), async(): Promise<void> => {
          // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
          await this.runCommands(receiver, comb.delayAfter, comb.delayBefore)
              .then(resolv)
              .catch(rej);
          // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
        }).catch(rej);
      })));
    } else if ((comb as MacroShortcutMapping).commands) {
      await this.runCommands((comb as MacroShortcutMapping).commands!, comb.delayAfter, comb.delayBefore);
    } else {
      throw Error(`Unknown shortcut ${JSON.stringify(comb)}`);
    }
  }

  private async runLoop(comb: ShortsData): Promise<void> {
    if (this.iterationsInProgress[comb.shortCut]) {
      this.iterationsInProgress[comb.shortCut] = false;
      this.logger.log(`Halting ${clc.bold.green(comb.name)}. Waiting for its command to finish...`);
    } else {
      this.iterationsInProgress[comb.shortCut] = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const copy: ShortsData = JSON.parse(JSON.stringify(comb));
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
