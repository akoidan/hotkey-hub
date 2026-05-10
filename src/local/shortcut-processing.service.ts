import {Injectable, Logger} from '@nestjs/common';
import clc from 'cli-color';
import {BaseLocalHandler} from '@/local/base-local-handler';
import {BehaviourEnum, BehaviourObject, Shortcut} from '@/config/types/shortcut';
import {SemaphorService} from '@/semaphor/semaphor-service';
import {RgbService} from '@/rgb/rgb-service';
import {IterationDescription, ProcessStatus} from '@/local/local-model';
import {ABORTED_BY_USER} from '@/client/client-model';
import {ConfigService} from '@/config/config-service';

@Injectable()
export class ShortcutProcessingService {
  private iterationsInProgress: Record<string, IterationDescription[]> = {};

  constructor(
    private readonly unknownCommandProcessor: BaseLocalHandler,
    private readonly configService: ConfigService,
    private readonly semaphoreService: SemaphorService,
    private readonly rgbService: RgbService,
    private readonly logger: Logger,
  ) {
  }

  async runShortcut(comb: Shortcut): Promise<void> {
    await this.semaphoreService.runOperation(comb, async(controller: AbortController) => {
      const {onLed, offLed, errorLed} = this.configService.getOpenRgb()!;
      const id = this.semaphoreService.getCurrentOperationId();
      const behaviour = typeof comb.behaviour === 'object' ? comb.behaviour.type : comb.behaviour;
      const groupWith = (comb.behaviour as BehaviourObject)?.groupWith ?? comb.shortCut;
      let finalLedColor = offLed!;
      try {
        this.rgbService.updateColor(comb.shortCut, onLed!);
        if (!this.iterationsInProgress[groupWith]) {
          this.iterationsInProgress[groupWith] = [];
        }
        if (behaviour === BehaviourEnum.pausable) {
          await this.runPausableProcess(comb, id, groupWith, controller);
        } else if (behaviour === BehaviourEnum.restart) {
          await this.runRestartableProcess(comb, id, groupWith, controller);
        } else { // comb.behaviour === 'stackable'
          await this.runLoop(comb, id, groupWith, controller);
        }
      } catch (e) {
        finalLedColor = errorLed!;
        throw e;
      } finally {
        const index = this.iterationsInProgress[groupWith].findIndex(proc => proc.id === id);
        if (index >= 0) {
          // if pausable, it won't start at all, so there's a possibility it's not running
          this.iterationsInProgress[groupWith].splice(index, 1);
        } else {
          this.logger.verbose(`Operation ${id} was used for termination, thus deletion from all iterationsInProgress is omited`);
        }
        const currentOps = this.iterationsInProgress[groupWith].filter(proc => proc.shortCut.shortCut === comb.shortCut);
        // do not turn off led if there are still operations in progres
        // unless current operation is errored
        if (currentOps.length === 0 || finalLedColor === errorLed) {
          this.rgbService.updateColor(comb.shortCut, finalLedColor);
        }
      }
    });
  }

  private terminateProcess(groupWith: string): void {
    this.iterationsInProgress[groupWith]
      .filter(proc => proc.status === ProcessStatus.RUNNING)
      .forEach(proc => {
        this.logger.debug(`Terminating ${proc.id}`);
        proc.status = ProcessStatus.TERMINATING;
        proc.controller.abort(ABORTED_BY_USER);
      });
  }

  private async runRestartableProcess(comb: Shortcut, id: string, groupWith: string, controller: AbortController): Promise<void> {
    const running = this.iterationsInProgress[groupWith]
      .map(proc => proc.status)
      .filter(s => s === ProcessStatus.RUNNING);
    if (running.length > 0) {
      this.logger.debug(`Stopping ${running.join(',')} instances of ${clc.bold.green(comb.name)}`);
      this.terminateProcess(groupWith);
    }
    await this.runLoop(comb, id, groupWith, controller);
  }

  private async runPausableProcess(comb: Shortcut, id: string, groupWith: string, controller: AbortController): Promise<void> {
    const statuses = this.iterationsInProgress[groupWith].map(proc => proc.status);
    if (statuses.includes(ProcessStatus.TERMINATING)) {
      // eslint-disable-next-line max-len
      this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Waiting previous to finish exe ${clc.bold.green(comb.name)}`);
    } else if (statuses.includes(ProcessStatus.RUNNING)) {
      this.logger.debug(`${clc.bold.green(comb.shortCut)} pressed. Terminating ${clc.bold.green(comb.name)}`);
      this.terminateProcess(groupWith);
    } else {
      await this.runLoop(comb, id, groupWith, controller);
    }
  }

  // eslint-disable-next-line
  async runLoop(comb: Shortcut, id: string, groupWith: string, controller: AbortController): Promise<void> {
    this.iterationsInProgress[groupWith].push({
      id,
      status: ProcessStatus.RUNNING,
      shortCut: comb,
      controller,
    });
    this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Running ${clc.bold.green(comb.name)}`);
    try {
      for (let i = 0; i < comb.commands.length; i++) {
        this.logger.debug('Executing item on the queue');
        await this.semaphoreService.spawnPromiseChild(
          `c=${String(i)}`,
          async() => {
            await this.unknownCommandProcessor.handle(comb.commands[i], comb.delayAfter, comb.delayBefore, undefined);
          }
        );
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (e.message?.includes(ABORTED_BY_USER)) {
        this.logger.log(`${clc.bold.green(comb.shortCut)} pressed. Stopped current executin for ${clc.bold.green(comb.name)}`);
      } else {
        throw e;
      }
    }
  }
}