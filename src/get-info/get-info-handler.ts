import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@/config/config-service';
import {ExecuteRequestRemoteCommand} from '@/config/types/get-commands';

@Injectable()
export abstract class GetInfoHandler {
  private next: GetInfoHandler | null = null;

  constructor(
    protected readonly clientService: ClientService,
    protected readonly configService: ConfigService,
  ) {
  }

  setNext(handler: GetInfoHandler): GetInfoHandler {
    this.next = handler;
    return handler;
  }

  abstract canHandle(command: ExecuteRequestRemoteCommand): boolean;

  abstract execute(destination: string, command: ExecuteRequestRemoteCommand): Promise<void>;

  async handle(destination: string, command: ExecuteRequestRemoteCommand): Promise<void> {
    if (this.canHandle(command)) {
      await this.execute(destination, command);
    } else if (this.next) {
      await this.next.handle(destination, command);
    } else {
      throw new Error(`No handler found for command type: ${JSON.stringify(command)}`);
    }
  }
}
