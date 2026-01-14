import {Injectable} from '@nestjs/common';

import {BaseCommand, GetProcessMainWindowCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetProcessMainWindowHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetProcessMainWindowCommand {
    return command.get === 'getProcessMainWindow';
  }

  protected async execute(destination: string, command: GetProcessMainWindowCommand): Promise<number> {
    return this.clientService.getProcessMainWindow(destination, command.variables.pid);
  }
}
