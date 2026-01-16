import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {
  GetWindowsIdByMultiplePidsVariables,
  GetWindowsIdByPidCommand,
} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowsIdByMultiplePidsHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetWindowsIdByPidCommand {
    return command.get === 'getWindowsIdByMultiplePids';
  }

  protected async execute(destination: string, command: GetWindowsIdByPidCommand): Promise<number[][]> {
    const {pids} = (command.variables as GetWindowsIdByMultiplePidsVariables);

    if (command.assignVariable.length !== pids.length) {
      throw new Error(`Unable to execute findProcessesWindows, on ${destination}` +
        ` since  ${JSON.stringify(command.assignVariable)} cannot be assigned to a` +
        `different number of variables: ${JSON.stringify(pids)}`);
    }
    return Promise.all(pids.map(async(id) => this.clientService.getProcessWindows(destination, id)));
  }
}
