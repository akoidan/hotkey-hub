import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetProcessMainWindowCommand } from '@/config/types/get-commands';

@Injectable()
export class GetProcessMainWindowHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetProcessMainWindowCommand {
    return command.get === 'getProcessMainWindow';
  }

  protected async handleRequest(destination: string, command: GetProcessMainWindowCommand): Promise<number> {
    return this.clientService.getProcessMainWindow(destination, command.variables.pid);
  }
}
