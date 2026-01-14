import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, IsWindowCommand } from '@/config/types/get-commands';

@Injectable()
export class IsWindowHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is IsWindowCommand {
    return command.get === 'isWindow';
  }

  protected async handleRequest(destination: string, command: IsWindowCommand): Promise<boolean> {
    return this.clientService.isWindow(destination, command.variables.wid);
  }
}
