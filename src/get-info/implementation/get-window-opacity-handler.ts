import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowOpacityCommand, WindowIdVariables} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowOpacityHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowOpacityCommand {
    return command.get === 'getWindowOpacity';
  }

  protected async execute(destination: string, command: GetWindowOpacityCommand): Promise<number> {
    const res = await this.clientService.window.getWindowOpacity(destination, (command.variables as WindowIdVariables).wid);
    return res.opacity;
  }
}
