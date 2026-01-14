import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { GetMonitorFromWindowCommand } from '@/config/types/get-commands';

@Injectable()
export class GetMonitorFromWindowHandler extends BaseGetHandler {
  canHandle(command: any): command is GetMonitorFromWindowCommand {
    return command.get === 'getMonitorFromWindow' && !!command.variables?.wid;
  }

  protected async handleRequest(destination: string, command: GetMonitorFromWindowCommand): Promise<any> {
    return this.clientService.getMonitorFromWindow(destination, command.variables.wid);
  }
}
