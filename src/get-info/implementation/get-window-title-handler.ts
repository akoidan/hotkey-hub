import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowTitleCommand, WindowIdVariables} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowTitleHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowTitleCommand {
    return command.get === 'getWindowTitle';
  }

  protected async execute(destination: string, command: GetWindowTitleCommand): Promise<string> {
    const res = await this.clientService.getWindowTitle(destination, (command.variables as WindowIdVariables).wid);
    return res.title;
  }
}
