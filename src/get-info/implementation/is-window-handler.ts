import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { IsWindowCommand } from '@/config/types/get-commands';

@Injectable()
export class IsWindowHandler extends BaseGetHandler {
  canHandle(command: any): command is IsWindowCommand {
    return command.get === 'isWindow' && !!command.variables?.wid;
  }

  protected async handleRequest(destination: string, command: IsWindowCommand): Promise<boolean> {
    return this.clientService.isWindow(destination, command.variables.wid);
  }
}
