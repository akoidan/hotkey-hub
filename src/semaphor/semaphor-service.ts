import {Inject, Injectable, Logger} from '@nestjs/common';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncLocalStorage} from 'async_hooks';
import {TransactionGroups} from '@/semaphor/semaphor-model';
import clc from 'cli-color';

@Injectable()
export class SemaphorService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static readonly COMB_KEY = 'comb';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static readonly COMB_KEYSTROKE = 'keystroke';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static readonly ABORT_CONTROLLER = 'abort-controller';

  private readonly transactionGroups: TransactionGroups = {};


  constructor(
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    private readonly logger: Logger,
  ) {
  }

  public async runOperation(shortCut: string, cb: (controller: AbortController) => Promise<void>): Promise<void> {
    const parts = shortCut.split('+');
    const randomValue = `${parts[parts.length - 1]}=${this.getNewTransactionId()}`;
    this.transactionGroups[randomValue] = [];
    await this.asyncLocalStorage.run(new Map(), async() => {
      const controller =  new AbortController();
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_KEY, randomValue);
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_KEYSTROKE, shortCut);
      this.asyncLocalStorage.getStore()!.set(SemaphorService.ABORT_CONTROLLER, new AbortController());
      await cb(controller);
    });
  }


  public getCurrentOperationId(): string {
    return this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
  }

  public getAbortController(): AbortController {
    return this.asyncLocalStorage.getStore()!.get(SemaphorService.ABORT_CONTROLLER) as AbortController;
  }

  public async spawnPromiseChild(i: string, cb: () => Promise<void>, separator: string = '-'): Promise<void> {
    const controller = this.getAbortController();
    const parentId = this.getCurrentOperationId();
    const newId = `${parentId}${separator}${i}`;
    const newStorageMap: Map<string, any> = new Map<string, any>()
      .set(SemaphorService.COMB_KEY, newId)
      .set(SemaphorService.COMB_KEYSTROKE, parentId)
      .set(SemaphorService.ABORT_CONTROLLER, controller);
    await this.asyncLocalStorage.run(newStorageMap, cb);
    this.logger.debug(`All actions for ${parentId} are completed`);
  }

  // public async* spawnGeneratorChild(
  //   i: string,
  //   cb: () => Promise<void>, separator: string = '-'
  // ): Promise<void> {
  //   this.logger.debug('Spawning new req-id');
  //   const parentId = this.getCurrentOperationId();
  //   const newId = `${parentId}${separator}${i}`;
  //   const newStorageMap = new Map<string, any>(this.asyncLocalStorage.getStore());
  //   newStorageMap.set(SemaphorService.COMB_KEY, newId);
  //
  //   const gen = cb();
  //   let result: IteratorResult<QueueItem, void>;
  //   do {
  //     // awaiting run here, so we would have asynlocalstorage context
  //     // otherwise e.g. with this yield *this.asyncLocalStorage.run(newStorageMap, cb)
  //     // we will lose context
  //     result = await this.asyncLocalStorage.run(newStorageMap, async() => {
  //       this.logger.debug('Pushing item into execution queue');
  //       return gen.next();
  //     });
  //     this.logger.debug(`Notifying executor to process next queue item ${i}`);
  //     yield result.value || 0;
  //   } while (!result.done);
  //
  //   this.logger.debug('Current Queue is complete');
  //   return result.value;
  // }

  public finishTransaction(transactionGroup: string, transactionId: string): void {
    this.logger.debug(`Finishing transactions on ${transactionGroup}: ${transactionId}`);
    const currentState = this.transactionGroups[transactionGroup];
    if (currentState[0].transactionId !== transactionId) {
      throw Error(`Invalid state for current id of queue[0] = ${currentState[0].transactionId}`);
    }
    const elements = currentState.shift();
    if (elements!.resolve) {
      this.logger.debug(`Releaseing ${elements!.resolveFrom}`);
      elements!.resolve();
    }
  }

  public getNewTransactionId(): string {
    return Math.random().toString(36).substring(2, 5);
  }

  public async startTransaction(trasactionGroup: string, transactionId: string): Promise<void> {
    let currentState = this.transactionGroups[trasactionGroup];
    if (!currentState) {
      // eslint-disable-next-line no-multi-assign
      currentState = this.transactionGroups[trasactionGroup] = [];
    }
    if (currentState.length > 0) {
      if (currentState[0].transactionId === transactionId) {
        this.logger.debug(`Continuing inside transaction ${transactionId}`);
        return;
      }

      const txId = currentState[currentState.length - 1]!.transactionId;
      this.logger.log(`Created a new transaction ${clc.yellow(transactionId)} but waiting ${clc.yellow(txId)} to finish`);
      await new Promise<void>(resolve => {
        currentState[currentState.length - 1].resolve = resolve;
        currentState[currentState.length - 1].resolveFrom = transactionId;
        currentState.push({transactionId, resolve: null, resolveFrom: null}); // push to queue this new transaction so others won't come before this one
      });
      this.logger.debug(`Lock released. Starting new transaction ${transactionId}`);
    } else {
      this.logger.debug(`Starting new transaction ${transactionId} in ${trasactionGroup}`);
      currentState.push({transactionId, resolve: null, resolveFrom: null});
    }
  }
}
