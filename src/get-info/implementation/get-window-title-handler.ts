import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowTitleCommand} from '@/config/types/get-commands/get-window-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowTitleHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowTitleCommand {
    return command.get === 'getWindowTitle';
  }

  protected async execute(destination: string, command: GetWindowTitleCommand): Promise<string> {
    return this.clientService.getWindowTitle(destination, command.variables.wid);
  }
}
