import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetMonitorInfoCommand} from '@/config/types/get-commands/get-monitor-commands';
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
