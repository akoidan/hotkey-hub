import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand, GetActiveWindowCommand} from '@/config/types/get-commands/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetActiveWindowIdHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetActiveWindowCommand {
    return command.get === 'getActiveWindow';
  }

  protected async execute(destination: string): Promise<unknown> {
    return this.clientService.getActiveWindowId(destination);
  }
}
