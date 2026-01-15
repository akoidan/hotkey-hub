import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetProcessMainWindowCommand} from '@/config/types/get-commands/get-process-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetProcessMainWindowHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetProcessMainWindowCommand {
    return command.get === 'getProcessMainWindow';
  }

  protected async execute(destination: string, command: GetProcessMainWindowCommand): Promise<number> {
    return this.clientService.getProcessMainWindow(destination, command.variables.pid);
  }
}
