import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand, GetWindowsIdByPidCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowsIdByPidHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowsIdByPidCommand {
    return command.get === 'getWindowsIdByPid';
  }

  protected async execute(destination: string, command: GetWindowsIdByPidCommand): Promise<number[]> {
    return this.clientService.getProcessWindows(destination, command.variables.id);
  }
}
