import {Injectable, Logger} from '@nestjs/common';
import clc from 'cli-color';
import {BaseLocalHandler} from '@/local/implementation/base-local-handler';
import {Shortcut} from '@/config/types/shortcut';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {RgbService} from '@/rgb/rgb-service';
import {IterationDescription, ProcessStatus} from '@/local/local-model';

@Injectable()
export class ShortcutProcessingService {
  private iterationsInProgress: Record<string, IterationDescription[]> = {};

  constructor(
    private readonly unkownCommandProcessor: BaseLocalHandler,
    private readonly semaphorService: SemaphorService,
    private readonly rgbService: RgbService,
    private readonly logger: Logger,
  ) {
  }

  async runShortcut(comb: Shortcut): Promise<void> {
    await this.semaphorService.runOperation(comb.shortCut, async () => {
      const id = this.semaphorService.getCurrentOperationId();
      try {
        if (!this.iterationsInProgress[comb.shortCut]) {
          this.iterationsInProgress[comb.shortCut] = [];
        }
        await this.rgbService.updateColors(comb.shortCut, true);
        const statuses = this.iterationsInProgress[comb.shortCut].map(proc => proc.status);
        if (comb.pausable && statuses.includes(ProcessStatus.TERMINATING)) {
          // eslint-disable-next-line max-len
          this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Waiting previous to finish exe ${clc.bold.green(comb.name)}`);
        } else if (comb.pausable && statuses.includes(ProcessStatus.RUNNING)) {
          this.iterationsInProgress[comb.shortCut]
            .filter(proc => proc.status === ProcessStatus.RUNNING)
            .forEach(proc => {
              proc.status = ProcessStatus.TERMINATING;
            });
          this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Terminating ${clc.bold.green(comb.name)}`);
          this.logger.debug('Waiting for remaining queue to finish their exectuion.');
        } else {
          this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Running ${clc.bold.green(comb.name)}`);
          this.iterationsInProgress[comb.shortCut].push({
            id,
            status: ProcessStatus.RUNNING,
          });
          await this.runProcess(comb, id);
          this.logger.debug(`All iterations for ${clc.bold.green(comb.name)} are finished`);
        }
      } finally {
        const index = this.iterationsInProgress[comb.shortCut].findIndex(proc => proc.id === id);
        if (index >= 0) {
          this.iterationsInProgress[comb.shortCut].splice(index, 1);
        }
        if (this.iterationsInProgress[comb.shortCut].length === 0) {
          await this.rgbService.updateColors(comb.shortCut, false);
        }
      }
    });
  }

  async runProcess(comb: Shortcut, id: string): Promise<void> {
    for (const command of comb.commands!) {
      const generator = this.unkownCommandProcessor.handle(command, comb.delayAfter, comb.delayBefore, undefined);
      let done = false;
      while (!done) {
        if (comb.pausable && this.iterationsInProgress[comb.shortCut].find(proc => proc.id === id)!.status === ProcessStatus.TERMINATING) {
          this.logger.debug(`Terminating ${clc.bold.green(comb.name)}.`);
          // await return is not required, we just skip calling next
          // also return is not technicaly correct cause we are mearing multiple generators in one manually in thread-local-handler
          await generator.return(undefined);
          this.iterationsInProgress[comb.shortCut].find(proc => proc.id === id)!.status = ProcessStatus.STOPPED;
        }
        const res = await generator.next();
        done = res.done ?? false;
      }
    }
  }
}