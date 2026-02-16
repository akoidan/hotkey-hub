import {Injectable} from '@nestjs/common';
import {UnknownCommand} from '@/config/types/commands';

@Injectable()
export abstract class BaseLocalHandler {
  protected startChain: BaseLocalHandler;
  private next: BaseLocalHandler | null = null;

  setNext(handler: BaseLocalHandler, startChain: BaseLocalHandler): BaseLocalHandler {
    this.next = handler;
    this.startChain = startChain;
    return handler;
  }

  abstract canHandle(command: UnknownCommand): boolean;

  abstract execute(
    input: UnknownCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined |null,
  ): Promise<void>

  public async handle(
    input: UnknownCommand,
    combDelayAfter: undefined | number,
    combDelayBefore: undefined | number,
    tId: string | undefined |null,
  ): Promise<void> {
    if (this.canHandle(input)) {
      await this.execute(input, combDelayAfter, combDelayBefore, tId);
    } else if (this.next) {
      await this.next.handle(input, combDelayAfter, combDelayBefore, tId);
    } else {
      throw new Error(`No handler found for command type: ${JSON.stringify(input)}`);
    }
  }
}
