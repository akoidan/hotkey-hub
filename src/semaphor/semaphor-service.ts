import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncLocalStorage} from 'async_hooks';

@Injectable()
export class SemaphorService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static readonly COMB_KEY = 'comb';

  private readonly transactionQueue: Record<string, ({
    resolve(): void;
    resolveFrom: string;
    currentId: string;
  } | {
    resolve: null;
    resolveFrom: null;
    currentId: string;
  })[]> = {};


  constructor(
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    private readonly logger: Logger,
  ) {
  }

  public startOperation(cb: () => Promise<void>): void {
    const randomValue = Math.random().toString(36).substring(2, 6);
    this.transactionQueue[randomValue] = [];
    this.asyncLocalStorage.run(new Map(), () => {
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_KEY, randomValue);
      void cb();
    });
  }

  public finishOperation():void {
    this.logger.debug(`All actions for ${this.getCurrentOperationId()} are completed`);
  }

  public getCurrentOperationId(): string {
    return this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
  }

  public spawnChild(i: number, cb: () => void): void {
    const parentId = this.getCurrentOperationId();
    const newId = `${parentId}-${i}`;
    const newStorageMap: Map<string, any> = new Map<string, any>().set(SemaphorService.COMB_KEY, newId);
    this.asyncLocalStorage.run(newStorageMap, cb);
  }

  public finishTransaction(destination: string): void {
    const currentState = this.transactionQueue[destination];
    const key = this.getCurrentOperationId();
    if (currentState[0].currentId !== key) {
      throw Error(`Invalid state for current id of queue[0] = ${currentState[0].currentId}`);
    }
    const elements = currentState.shift();
    if (elements!.resolve) {
      this.logger.debug(`Releaseing ${elements!.resolveFrom}`);
      elements!.resolve();
    }
  }

  public async startTransaction(destination: string): Promise<void> {
    let currentState = this.transactionQueue[destination];
    if (!currentState) {
      // eslint-disable-next-line no-multi-assign
      currentState = this.transactionQueue[destination] = [];
    }
    if (currentState.length > 0) {
      if (currentState[0].currentId === this.getCurrentOperationId()) {
        // this operation is the same transaction
        return;
      }
      this.logger.log(`Awaiting ${currentState[currentState.length - 1]!.currentId} to finish`);
      await new Promise<void>(resolve => {
        currentState[currentState.length - 1].resolve = resolve;
        currentState[currentState.length - 1].resolveFrom = this.getCurrentOperationId();
        currentState.push({currentId: this.getCurrentOperationId(), resolve: null, resolveFrom: null}); // push to queue this new transaction so others won't come before this one
      });
    } else {
      currentState.push({currentId: this.getCurrentOperationId(), resolve: null, resolveFrom: null});
    }
  }
}
