import {Injectable, Logger} from '@nestjs/common';
import clc from 'cli-color';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {BehaviourEnum, BehaviourObject, Shortcut} from '@/config/types/shortcut';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {RgbService} from '@/rgb/rgb-service';
import {IterationDescription, ProcessStatus} from '@/local/local-model';
import {QueueItem} from '@/generator/generator-model';

@Injectable()
export class ShortcutProcessingService {
  private iterationsInProgress: Record<string, IterationDescription[]> = {};

  constructor(
    private readonly unknownCommandProcessor: BaseLocalHandler,
    private readonly semaphoreService: SemaphorService,
    private readonly rgbService: RgbService,
    private readonly logger: Logger,
  ) {
  }

  async runShortcut(comb: Shortcut): Promise<void> {
    await this.semaphoreService.runOperation(comb.shortCut, async(controller: AbortController) => {
      const id = this.semaphoreService.getCurrentOperationId();
      const behaviour = typeof comb.behaviour === 'object' ? comb.behaviour.type : comb.behaviour;
      const groupWith = (comb.behaviour as BehaviourObject)?.groupWith ?? comb.shortCut;
      try {
        await this.rgbService.updateColors(comb.shortCut, true);
        if (!this.iterationsInProgress[groupWith]) {
          this.iterationsInProgress[groupWith] = [];
        }
        if (behaviour === BehaviourEnum.pausable) {
          await this.runPausableProcess(comb, id, groupWith, controller);
        } else if (behaviour === BehaviourEnum.restart) {
          await this.runRestartableProcess(comb, id, groupWith, controller);
        } else { // comb.behaviour === 'stackable'
          await this.runGeneratorLoop(comb, id, groupWith, controller);
        }
      } finally {
        const index = this.iterationsInProgress[groupWith].findIndex(proc => proc.id === id);
        if (index >= 0) {
          // if pausable, it won't start at all, so there's a possibility it's not running
          this.iterationsInProgress[groupWith].splice(index, 1);
        } else {
          this.logger.debug(`Operation ${id} was used for termination, thus deletion from all iterationsInProgress is omited`);
        }
        if (this.iterationsInProgress[groupWith].filter(proc => proc.shortCut.shortCut === comb.shortCut).length === 0) {
          await this.rgbService.updateColors(comb.shortCut, false);
        }
      }
    });
  }

  private terminateProcess(groupWith: string, controller: AbortController): void {
    this.iterationsInProgress[groupWith]
      .filter(proc => proc.status === ProcessStatus.RUNNING)
      .forEach(proc => {
        proc.status = ProcessStatus.TERMINATING;
        controller.abort();
      });
  }

  private async runRestartableProcess(comb: Shortcut, id: string, groupWith: string, controller: AbortController): Promise<void> {
    const running = this.iterationsInProgress[groupWith]
      .map(proc => proc.status)
      .filter(s => s === ProcessStatus.RUNNING);
    if (running.length > 0) {
      this.logger.debug(`Stopping ${running.join(',')} instances of ${clc.bold.green(comb.name)}`);
      this.terminateProcess(groupWith, controller);
    }
    await this.runGeneratorLoop(comb, id, groupWith, controller);
  }

  private async runPausableProcess(comb: Shortcut, id: string, groupWith: string, controller: AbortController): Promise<void> {
    const statuses = this.iterationsInProgress[groupWith].map(proc => proc.status);
    if (statuses.includes(ProcessStatus.TERMINATING)) {
      // eslint-disable-next-line max-len
      this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Waiting previous to finish exe ${clc.bold.green(comb.name)}`);
    } else if (statuses.includes(ProcessStatus.RUNNING)) {
      this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Terminating ${clc.bold.green(comb.name)}`);
      this.logger.debug('Waiting for remaining queue to finish their exectuion.');
      this.terminateProcess(groupWith, controller);
    } else {
      await this.runGeneratorLoop(comb, id, groupWith, controller);
    }
  }

  // eslint-disable-next-line
  async runGeneratorLoop(comb: Shortcut, id: string, groupWith: string, controller: AbortController): Promise<void> {
    this.iterationsInProgress[groupWith].push({
      id,
      status: ProcessStatus.RUNNING,
      shortCut: comb,
      controller,
    });
    this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Running ${clc.bold.green(comb.name)}`);
    const that = this;
    let breakLoop = false;
    for (let i = 0; i < comb.commands.length; i++) {
      const promise = this.semaphoreService.spawnPromiseChild(
        `c=${String(i)}`,
        async function loopGenerator(): Promise<void> {
          await that.unknownCommandProcessor.handle(comb.commands[i], comb.delayAfter, comb.delayBefore, undefined);
        }
      );
      let done = false;
      while (!done) {
        const a = this.iterationsInProgress[groupWith].find(proc => proc.id === id)!;
        if (a.status === ProcessStatus.TERMINATING) {
          this.logger.debug(`Terminating ${clc.bold.green(comb.name)}.`);
          // await return is not required, we just skip calling next
          // also return is not technicaly correct cause we are mearing multiple generators in one manually in thread-local-handler
          // No longer needed since we converted to async function
          this.iterationsInProgress[groupWith].find(proc => proc.id === id)!.status = ProcessStatus.STOPPED;
          breakLoop = true; //while should finish in order to finish current transaction and release transaction group
          done = true; // Exit the while loop
        }
        this.logger.debug('Executing item on the queue');
        await promise;
        done = true; // Exit after executing once
      }
      if (breakLoop) {
        break;
      }
    }
    const blah = this.iterationsInProgress[groupWith].find(proc => proc.id === id)!;
    if (blah.status === ProcessStatus.STOPPED) {
      this.logger.log(`Iterations of ${clc.bold.green(comb.name)} are stoped`);
    } else {
      this.logger.debug(`All iterations for ${clc.bold.green(comb.name)} are finished`);
    }
  }
}