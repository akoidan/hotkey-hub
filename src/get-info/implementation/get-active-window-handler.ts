import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { GetActiveWindowCommand } from '@/config/types/get-commands';

@Injectable()
export class GetActiveWindowHandler extends BaseGetHandler {
  canHandle(command: any): command is GetActiveWindowCommand {
    return command.get === 'getActiveWindow';
  }

  protected async handleRequest(destination: string): Promise<number> {
    return this.clientService.getActiveWindow(destination);
  }
}
