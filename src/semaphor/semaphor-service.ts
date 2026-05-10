import {Inject, Injectable, Logger} from '@nestjs/common';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncLocalStorage} from 'async_hooks';
import {TransactionGroups} from '@/semaphor/semaphor-model';
import clc from 'cli-color';
import {ConfigCombination} from '@/config/config-model';

@Injectable()
export class SemaphorService {
  public static readonly COMB_KEY = 'comb';
  public static readonly COMB_KEYSTROKE = 'keystroke';
  public static readonly COMB_SHORTCUT = 'shorcut';
  public static readonly ABORT_CONTROLLER = 'abort-controller';


  /**
   * Queue entries store the resolve of the transaction waiting AFTER them, not their own.
   *
   * so lets say we have #1 transaction (T1) in progress. The one we added to this transactionGroups.
   * T1 will not wait on startTrasaction, but T2 will wait until T1 resolves
   * When we call finishTransaction on T1, it will resolve T2.
   * Since T1 will have Pointer to T2 resolve
   * Consider Value =a LinkedList (or a Queue). Only head can be resolved first, every other transaction would be blocked
   */
  private readonly transactionGroupsQueue: TransactionGroups = {};


  constructor(
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    private readonly logger: Logger,
  ) {
  }

  public async runOperation(shortCut: ConfigCombination, cb: (controller: AbortController) => Promise<void>): Promise<void> {
    const parts = shortCut.shortCut.split('+');
    const randomValue = `${parts[parts.length - 1]}=${this.getNewTransactionId()}`;
    this.transactionGroupsQueue[randomValue] = [];
    await this.asyncLocalStorage.run(new Map(), async() => {
      const controller =  new AbortController();
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_KEY, randomValue);
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_KEYSTROKE, shortCut.shortCut);
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_SHORTCUT, shortCut);
      this.asyncLocalStorage.getStore()!.set(SemaphorService.ABORT_CONTROLLER, controller);
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
    this.logger.verbose(`All actions for ${parentId} are completed`);
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
    this.logger.verbose(`Finishing transactions on ${transactionGroup}: ${transactionId}`);
    const currentState = this.transactionGroupsQueue[transactionGroup];
    const i = currentState.findIndex(a => a.transactionId === transactionId);
    if (i < 0) {
      throw Error(`Can't find info about Tx=${transactionId} in the transactionGroups`);
    }
    if (i === 0) {
      // Probably this transaction is finished, abort cannot be fired from startTransaction
      // Since first transaction doesnt wait for other transaction
      // Before: T1 -> T2 -> T3 -> T4
      // After: T2 -> T3 -> T4 (t2 is resolved from T1)
      const elements = currentState.shift();
      if (elements!.resolve) {
        this.logger.verbose(`Releaseing ${elements!.resolveFrom}`);
        elements!.resolve();
      }
    } else {
      // probably abort fired from T2, I dont think other cases possible
      // Since 2nd transaction cannot be finished (since it has to wait until 1st finishes in order to run)
      // Before: T1 -> T2 -> T3 -> T4, drop T3
      // After: T1 -> T2 -> T4
      currentState[i - 1].resolve = currentState[i].resolve;
      currentState[i - 1].resolveFrom = currentState[i].resolveFrom;
      currentState.splice(i, 1);
    }
  }

  public getNewTransactionId(): string {
    return Math.random().toString(36).substring(2, 5);
  }

  public async startTransaction(trasactionGroup: string, transactionId: string): Promise<void> {
    let currentState = this.transactionGroupsQueue[trasactionGroup];
    if (!currentState) {
      // eslint-disable-next-line no-multi-assign
      currentState = this.transactionGroupsQueue[trasactionGroup] = [];
    }
    const controller: AbortController = this.asyncLocalStorage.getStore()!.get(SemaphorService.ABORT_CONTROLLER) as AbortController;
    const combKey  = this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
    if (currentState.length > 0) {
      if (currentState[0].transactionId === transactionId) {
        this.logger.verbose(`Continuing inside transaction ${transactionId}`);
        return;
      }

      const txId = currentState[currentState.length - 1]!.transactionId;
      this.logger.log(`Created a new transaction ${clc.yellow(transactionId)} but waiting ${clc.yellow(txId)} to finish`);

      let abortHandler :(() => void)|null = null;

      await new Promise<void>((resolve, reject) => {
        currentState[currentState.length - 1].resolve = resolve;
        currentState[currentState.length - 1].resolveFrom = transactionId;
        abortHandler = (): void => {
          this.logger.debug(`Aborting current operation ${combKey}`);
          reject(Error(controller.signal.reason as string));
        };
        controller.signal.addEventListener('abort', abortHandler, {once: true});
        currentState.push({transactionId, resolve: null, resolveFrom: null}); // push to queue this new transaction so others won't come before this one
      });
      controller.signal.removeEventListener('abort', abortHandler!);

      this.logger.verbose(`Lock released. Starting new transaction ${transactionId}`);
    } else {
      this.logger.verbose(`Starting new transaction ${transactionId} in ${trasactionGroup}`);
      currentState.push({transactionId, resolve: null, resolveFrom: null});
    }
  }
}
