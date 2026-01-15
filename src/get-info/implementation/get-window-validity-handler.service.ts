import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowValidityCommand, WindowIdVariables} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowValidityHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowValidityCommand {
    return command.get === 'getWindowValidity';
  }

  protected async execute(destination: string, command: GetWindowValidityCommand): Promise<boolean> {
    const res = await  this.clientService.isWindow(destination, (command.variables as WindowIdVariables).wid);
    return res.isValid;
  }
}
