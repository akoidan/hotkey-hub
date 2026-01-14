import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetWindowTitleCommand } from '@/config/types/get-commands';

@Injectable()
export class GetWindowTitleHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetWindowTitleCommand {
    return command.get === 'getWindowTitle';
  }

  protected async handleRequest(destination: string, command: GetWindowTitleCommand): Promise<string> {
    return this.clientService.getWindowTitle(destination, command.variables.wid);
  }
}
