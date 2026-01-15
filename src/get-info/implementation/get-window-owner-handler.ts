import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowOwnerCommand, WindowIdVariables} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowOwnerHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowOwnerCommand {
    return command.get === 'getWindowOwner';
  }

  protected async execute(destination: string, command: GetWindowOwnerCommand): Promise<any> {
    const res = await this.clientService.getWindowOwner(destination, (command.variables as WindowIdVariables).wid);
    return res.wid;
  }
}
