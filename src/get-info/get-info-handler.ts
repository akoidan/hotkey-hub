import {ClientService} from '@/client/client-service';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {GetInfoRemoteCommand} from '@/config/types/get-commands';

@Injectable()
export abstract class GetInfoHandler {
  private next: GetInfoHandler | null = null;

  constructor(
    protected readonly clientService: ClientService,
    protected readonly configService: ConfigService,
    protected readonly logger: Logger,
  ) {
  }

  setNext(handler: GetInfoHandler): GetInfoHandler {
    this.next = handler;
    return handler;
  }

  protected abstract canHandle(command: GetInfoRemoteCommand): boolean;

  protected abstract execute(destination: string, command: GetInfoRemoteCommand): Promise<unknown>;

  async handle(destination: string, command: GetInfoRemoteCommand): Promise<unknown> {
    if (this.canHandle(command)) {
      return this.execute(destination, command);
    }
    if (this.next) {
      return this.next.handle(destination, command);
    }
    throw new Error(`No handler found for command type: ${JSON.stringify(command)}`);
  }
}
