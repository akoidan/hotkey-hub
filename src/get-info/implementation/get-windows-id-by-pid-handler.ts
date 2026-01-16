import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetWindowsIdByPidCommand, GetWindowsIdByPidVariables} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowsIdByPidHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowsIdByPidCommand {
    return command.get === 'getWindowsIdByPid';
  }

  protected async execute(destination: string, command: GetWindowsIdByPidCommand): Promise<number[]> {
    return this.clientService.getProcessWindows(destination, (command.variables as GetWindowsIdByPidVariables).pid);
  }
}
