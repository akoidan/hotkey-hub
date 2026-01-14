import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetWindowOwnerCommand } from '@/config/types/get-commands';

@Injectable()
export class GetWindowOwnerHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetWindowOwnerCommand {
    return command.get === 'getWindowOwner';
  }

  protected async handleRequest(destination: string, command: GetWindowOwnerCommand): Promise<any> {
    return this.clientService.getWindowOwner(destination, command.variables.wid);
  }
}
