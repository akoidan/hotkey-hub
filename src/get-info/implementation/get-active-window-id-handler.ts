import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetActiveWindowIdCommand} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetActiveWindowIdHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetActiveWindowIdCommand {
    return command.get === 'getActiveWindow';
  }

  protected async execute(destination: string): Promise<unknown> {
    return this.clientService.getActiveWindowId(destination);
  }
}
