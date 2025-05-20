import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ASYNC_PROVIDER } from '@/asyncstore/async-storage-const';
import { AsyncLocalStorage } from 'async_hooks';
import { ConfigService } from '@/config/config-service';

@Injectable()
export class SemaphorService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static readonly COMB_KEY = 'comb';

  private readonly iterationsInProgress: Record<string, {
    resolve: () => void,
    from: string,
  }[]> = {};
  private readonly destinationsInProgress: Record<string, string[]> = {};


  private getDebugState(): string {
    const state = {
      iterationsInProgress: JSON.stringify(this.iterationsInProgress, null, 2),
      destinationsInProgress: JSON.stringify(this.destinationsInProgress, null, 2),
    };
    return JSON.stringify(state, null, 2);
  }

  constructor(
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
  }

  public startTransaction(cb: () => Promise<void>): void {
    const randomValue = Math.random().toString(36).substring(2, 6);
    this.iterationsInProgress[randomValue] = [];
    this.logger.debug(`[PARENT] Starting new parent operation ${randomValue}\nCurrent state:\n${this.getDebugState()}`);
    this.asyncLocalStorage.run(new Map(), () => {
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_KEY, randomValue);
      void cb();
    });
  }

  public getCurrentOperationId(): string {
    return this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
  }

  public spawnChild(i: number, cb: () => void): void {
    const parentId = this.getCurrentOperationId();
    const newId = `${parentId}-${i}`;
    this.iterationsInProgress[newId] = [];
    this.logger.debug(`[CHILD] Spawning child operation ${newId} from parent ${parentId}\nParent waiting ops: ${this.iterationsInProgress[parentId]?.length ?? 0}\nCurrent state:\n${this.getDebugState()}`);
    const newStorageMap: Map<string, any> = new Map<string, any>().set(SemaphorService.COMB_KEY, newId);
    this.asyncLocalStorage.run(newStorageMap, cb);
  }

  public async awaitOperation(destination: string): Promise<void> {
    const currentId = this.getCurrentOperationId();
    const parentId = currentId.includes('-') ? currentId.split('-')[0] : currentId;
    this.logger.debug(`[QUEUE] Operation ${currentId} (parent: ${parentId}) requesting access to ${destination}`);
    this.logger.debug(`[STATE] Operation ${currentId} state check:\n operation ${this.getDebugState()}`);

    if (!this.configService.queueEnabled()) {
      return;
    }
    let processingId = this.destinationsInProgress[destination];
    if (!processingId) {
      processingId = [];
      this.destinationsInProgress[destination] = processingId;
    }
    const currentOperationId = this.getCurrentOperationId();
    if (!processingId.includes(currentOperationId)) {
      processingId.push(currentOperationId);
    }
    this.logger.debug(`[QUEUE_ORDER] Operation ${currentOperationId} checking position in ${destination} queue. Queue state: ${JSON.stringify(processingId)}`);
    while (processingId[0] !== currentOperationId) {
      this.logger.debug(`[QUEUE_ORDER] Operation ${currentOperationId} is at position ${processingId.indexOf(currentOperationId)}, waiting for ${processingId[0]} which is at front`);
      const waitingOnParentId = processingId[0].includes('-') ? processingId[0].split('-')[0] : processingId[0];
      this.logger.debug(`[WAIT] Operation ${currentOperationId} awaiting ${processingId[0]} (parent: ${waitingOnParentId}) to finish for ${destination}\nWaiting ops for ${processingId[0]}: ${this.iterationsInProgress[processingId[0]]?.length ?? 0}\nCurrent state:\n${this.getDebugState()}`);
      await new Promise<void>(resolve => {
        this.iterationsInProgress[processingId[0]]!.push({ resolve, from: currentOperationId });
      });
      this.logger.debug(`${processingId[0]} is resolved, proceeding to ${destination}`);
    }
  }

  public commitTransaction(): void {
    const key = this.getCurrentOperationId();
    const parentId = key.includes('-') ? key.split('-')[0] : key;
    const isChild = key !== parentId;
    this.logger.debug(`[FINISH] ${isChild ? 'Child' : 'Parent'} operation ${key} finishing\nParent: ${parentId}\nWaiting ops: ${this.iterationsInProgress[key]?.length ?? 0}\nPre-cleanup state:\n${this.getDebugState()}`);
    for (const [destination, threads] of Object.entries(this.destinationsInProgress)) {
      while (threads.includes(key)) {
        this.logger.debug(`Removing ${key} from ${destination} queue`);
        threads.splice(threads.indexOf(key), 1);
      }
    }
    const awaitedResolving = this.iterationsInProgress[key] ?? [];
    this.logger.debug(`[RESOLVE] Operation ${key} starting to resolve ${awaitedResolving.length} waiting operations`);
    let i = 0;
    for (const awaited of awaitedResolving) {
      this.logger.debug(`[RESOLVE] Operation ${key} resolving operation, ${awaitedResolving.length - i} remaining`);
      awaited.resolve();
      this.logger.debug(`Unlocking ${awaited.from} operations from ${key} in ${i * 10}ms`);
    }
    delete this.iterationsInProgress[key];
    this.logger.debug(`Operation ${key} finished\nPost-cleanup state:\n${this.getDebugState()}`);
  }
}
