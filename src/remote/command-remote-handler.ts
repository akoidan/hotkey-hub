import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';
import {RemoteCommand} from '@/config/types/remote-commands';

@Injectable()
export abstract class CommandRemoteHandler {
  private next: CommandRemoteHandler | null = null;

  constructor(
    protected readonly clientService: ClientService,
  ) {
  }

  setNext(handler: CommandRemoteHandler): CommandRemoteHandler {
    this.next = handler;
    return handler;
  }

  abstract canHandle(command: RemoteCommand): boolean;

  abstract execute(destination: string, command: RemoteCommand): Promise<void>;

  async handle(destination: string, command: RemoteCommand): Promise<void> {
    if (this.canHandle(command)) {
      await this.execute(destination, command);
    } else if (this.next) {
      await this.next.handle(destination, command);
    } else {
      throw new Error(`No handler found for command type: ${JSON.stringify(command)}`);
    }
  }
}
