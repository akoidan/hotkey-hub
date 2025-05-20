import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {ASYNC_PROVIDER} from '@/asyncstore/async-storage-const';
import {AsyncLocalStorage} from 'async_hooks';
import {ConfigService} from '@/config/config-service';
import clc from 'cli-color';
import {QueuedTransaction} from '@/mutex/mutex-model';

@Injectable()
export class MutexService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public static readonly COMB_KEY = 'comb';

  private readonly transactionQueue: QueuedTransaction[] = [];

  constructor(
    @Inject(ASYNC_PROVIDER)
    private readonly asyncLocalStorage: AsyncLocalStorage<Map<string, any>>,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
  }

  private getDebugState(): string {
    return JSON.stringify(this.transactionQueue);
  }

  public async startTransaction(shortcut: string, cb: () => Promise<void>): Promise<void> {
    const randomValue = Math.random().toString(36).substring(2, 6);

    await this.asyncLocalStorage.run(new Map(), async() => {
      this.asyncLocalStorage.getStore()!.set(MutexService.COMB_KEY, randomValue);
      this.logger.log(`${clc.bold.green(shortcut)} pressed`);

      if (!this.configService.mutex()) {
        this.logger.debug('Skipping mutex state cause its disabled');
      } else if (this.transactionQueue.length > 0) {
        this.logger.log(`Awaiting ${this.transactionQueue[this.transactionQueue.length - 1].id} to finish`);
        await new Promise<void>(resolve => {
          this.transactionQueue[this.transactionQueue.length - 1].resolve = resolve;
          this.transactionQueue[this.transactionQueue.length - 1].resolveId = randomValue;
          this.transactionQueue.push({id: randomValue, resolve: null, resolveId: null}); // push to queue this new transaction so others won't come before this one
        });
      } else {
        this.transactionQueue.push({id: randomValue, resolve: null, resolveId: null});
      }
      await cb();
    });
  }

  public getCurrentOperationId(): string {
    return this.asyncLocalStorage.getStore()!.get(MutexService.COMB_KEY) as string;
  }

  public spawnChild(i: number, cb: () => void): void {
    const parentId = this.getCurrentOperationId();
    const randomValue = `${parentId}-${i}`;

    this.logger.debug(`[CHILD] Spawning child operation ${randomValue} from parent ${parentId}\nCurrent state:\n${this.getDebugState()}`);

    const newStorageMap = new Map<string, any>().set(MutexService.COMB_KEY, randomValue);
    this.asyncLocalStorage.run(newStorageMap, cb);
  }

  public commitTransaction(): void {
    const key = this.getCurrentOperationId();
    if (key.includes('-')) {
      return;
    }
    const resolvers = this.transactionQueue.find(el => el.id === key);
    if (resolvers!.resolve) {
      this.logger.debug(`Releaseing ${resolvers!.resolveId}`);
      resolvers!.resolve();
    }
  }
}
