import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowBoundsCommand, WindowIdVariables} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowBoundsHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowBoundsCommand {
    return command.get === 'getWindowBounds';
  }

  protected async execute(destination: string, command: GetWindowBoundsCommand): Promise<any> {
    return this.clientService.getWindowBounds(destination, (command.variables as WindowIdVariables).wid);
  }
}
