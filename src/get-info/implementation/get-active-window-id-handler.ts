import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetActiveWindowIdCommand } from '@/config/types/get-commands';

@Injectable()
export class GetActiveWindowIdHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetActiveWindowIdCommand {
    return command.get === 'getActiveWindowId';
  }

  protected async handleRequest(destination: string): Promise<number> {
    return this.clientService.getActiveWindowId(destination);
  }
}
