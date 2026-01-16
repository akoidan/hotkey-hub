import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetActiveWindowIdCommand} from '@/config/types/get-commands/get-window-commands-schema';
import {GetActiveWindowInfoResponse} from '@/client/dtos';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetActiveWindowInfoHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetActiveWindowIdCommand {
    return command.get === 'getActiveWindowId';
  }

  protected async execute(destination: string): Promise<GetActiveWindowInfoResponse> {
    return this.clientService.window.getActiveWindowInfo(destination);
  }
}
