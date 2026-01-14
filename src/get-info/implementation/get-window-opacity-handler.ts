import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { GetWindowOpacityCommand } from '@/config/types/get-commands';

@Injectable()
export class GetWindowOpacityHandler extends BaseGetHandler {
  canHandle(command: any): command is GetWindowOpacityCommand {
    return command.get === 'getWindowOpacity' && !!command.variables?.wid;
  }

  protected async handleRequest(destination: string, command: GetWindowOpacityCommand): Promise<number> {
    return this.clientService.getWindowOpacity(destination, command.variables.wid);
  }
}
