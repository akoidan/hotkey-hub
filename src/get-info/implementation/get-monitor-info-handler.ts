import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand, GetMonitorInfoCommand} from '@/config/types/get-commands/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetMonitorInfoHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetMonitorInfoCommand {
    return command.get === 'getMonitorInfo';
  }

  protected async execute(destination: string, command: GetMonitorInfoCommand): Promise<any> {
    return this.clientService.monitorInfo(destination, command.variables.mid);
  }
}
