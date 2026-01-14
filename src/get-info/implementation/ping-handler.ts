import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { PingCommand } from '@/config/types/get-commands';

@Injectable()
export class PingHandler extends BaseGetHandler {
  canHandle(command: any): command is PingCommand {
    return command.get === 'ping';
  }

  protected async handleRequest(destination: string): Promise<void> {
    return this.clientService.ping(destination);
  }
}
