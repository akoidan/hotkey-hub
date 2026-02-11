import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetMonitorInfoCommand, MonitorVariables} from '@/config/types/get-commands/get-monitor-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {MonitorInfoResponseDto} from '@/client/dtos';

@Injectable()
export class GetMonitorInfoHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetMonitorInfoCommand {
    return command.get === 'getMonitorInfo';
  }

  protected async execute(destination: string, command: GetMonitorInfoCommand): Promise<MonitorInfoResponseDto> {
    return this.clientService.monitor.getMonitorInfo(destination, (command.variables as MonitorVariables).mid);
  }
}
