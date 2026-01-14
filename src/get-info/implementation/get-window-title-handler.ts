import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { GetWindowTitleCommand } from '@/config/types/get-commands';

@Injectable()
export class GetWindowTitleHandler extends BaseGetHandler {
  canHandle(command: any): command is GetWindowTitleCommand {
    return command.get === 'getWindowTitle' && !!command.variables?.wid;
  }

  protected async handleRequest(destination: string, command: GetWindowTitleCommand): Promise<string> {
    return this.clientService.getWindowTitle(destination, command.variables.wid);
  }
}
