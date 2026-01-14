import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {IsWindowCommand} from '@/config/types/get-commands/get-window-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class IsWindowHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is IsWindowCommand {
    return command.get === 'isWindow';
  }

  protected async execute(destination: string, command: IsWindowCommand): Promise<boolean> {
    return this.clientService.isWindow(destination, command.variables.wid);
  }
}
