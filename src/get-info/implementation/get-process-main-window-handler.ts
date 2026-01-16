import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {
  GetProcessMainWindowCommand,
  GetProcessMainWindowVariables,
} from '@/config/types/get-commands/get-process-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetProcessMainWindowHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetProcessMainWindowCommand {
    return command.get === 'getProcessMainWindow';
  }

  protected async execute(destination: string, command: GetProcessMainWindowCommand): Promise<number> {
    const res = await this.clientService.process.getProcessMainWindow(destination, (command.variables as GetProcessMainWindowVariables).pid);
    return res.wid;
  }
}
