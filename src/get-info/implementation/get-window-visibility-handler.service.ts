import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowVisibilityCommand} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowVisibilityHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowVisibilityCommand {
    return command.get === 'getWindowVisibility';
  }

  protected async execute(destination: string, command: GetWindowVisibilityCommand): Promise<boolean> {
    return this.clientService.isWindowVisible(destination, command.variables.wid);
  }
}
