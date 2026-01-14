import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, IsWindowVisibleCommand } from '@/config/types/get-commands';

@Injectable()
export class IsWindowVisibleHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is IsWindowVisibleCommand {
    return command.get === 'isWindowVisible';
  }

  protected async handleRequest(destination: string, command: IsWindowVisibleCommand): Promise<boolean> {
    return this.clientService.isWindowVisible(destination, command.variables.wid);
  }
}
