import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowBoundsCommand} from '@/config/types/get-commands/get-window-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowBoundsHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowBoundsCommand {
    return command.get === 'getWindowBounds';
  }

  protected async execute(destination: string, command: GetWindowBoundsCommand): Promise<any> {
    return this.clientService.getWindowBounds(destination, command.variables.wid);
  }
}
