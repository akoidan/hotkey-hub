import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetWindowBoundsCommand } from '@/config/types/get-commands';

@Injectable()
export class GetWindowBoundsHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetWindowBoundsCommand {
    return command.get === 'getWindowBounds';
  }

  protected async handleRequest(destination: string, command: GetWindowBoundsCommand): Promise<any> {
    return this.clientService.getWindowBounds(destination, command.variables.wid);
  }
}
