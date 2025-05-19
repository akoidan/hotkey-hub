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

  private readonly iterationsInProgress = new Map<string, (() => void)[]>();
  private readonly destinationsInProgress = new Map<string, string[]>();

  constructor(
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    private readonly logger: Logger,
  ) {
  }

  public startOperation(cb: () => Promise<void>): void {
    const randomValue = Math.random().toString(36).substring(2, 6);
    this.iterationsInProgress.set(randomValue, []);
    this.asyncLocalStorage.run(new Map(), () => {
      this.asyncLocalStorage.getStore()!.set(SemaphorService.COMB_KEY, randomValue);
      void cb();
    });
  }

  public getCurrentOperationId(): string {
    return this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
  }

  public getMainOperationId(): string {
    const currentId = this.getCurrentOperationId();
    return currentId.split('-')[0];
  }

  // public isCurrentOperationLocked(): boolean {
  //   const currentId = this.getCurrentOperationId();
  //   const mainId = currentId.split('-')[0];
  //   if
  //   return this.asyncLocalStorage.getStore()!.get(SemaphorService.COMB_KEY) as string;
  // }

  public spawnChild(i: number, cb: () => void): void {
    const newId = `${this.getCurrentOperationId()}-${i}`;
    const newStorageMap: Map<string, any> = new Map<string, any>().set(SemaphorService.COMB_KEY, newId);
    this.asyncLocalStorage.run(newStorageMap, cb);
  }

  public async awaitOperation(destination: string): Promise<void> {
    let processingId = this.destinationsInProgress.get(destination);
    if (!processingId) {
      processingId = [];
      this.destinationsInProgress.set(destination, processingId);
    }
    const currentOperationId = this.getMainOperationId();
    if (!processingId.includes(currentOperationId)) {
      processingId.push(currentOperationId);
    }
    while (processingId[0] !== currentOperationId) {
      this.logger.debug(`Awaiting ${processingId[0]} to finish`);
      await new Promise<void>(resolve => {
        this.iterationsInProgress!.get(processingId[0])!.push(resolve);
      });
      this.logger.debug(`${processingId[0]} is resolved, proceeding to ${destination}`);
    }
  }

  public finishOperation(): void {
    const key = this.getMainOperationId();
    for (const [destination, threads] of this.destinationsInProgress.entries()) {
      if (threads.includes(key)) {
        this.logger.debug(`Removing ${key} from ${destination} queue`);
        threads.splice(threads.indexOf(key), 1);
      }
    }
    const awaitedResolving = this.iterationsInProgress.get(key)!;
    for (const resolve of awaitedResolving) {
      resolve();
    }
    this.iterationsInProgress.delete(key);
  }
}
