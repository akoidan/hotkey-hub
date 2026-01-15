import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetMonitorScaleFactorCommand, MonitorVariables} from '@/config/types/get-commands/get-monitor-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetMonitorScaleFactorHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetMonitorScaleFactorCommand {
    return command.get === 'getMonitorScaleFactor';
  }

  protected async execute(destination: string, command: GetMonitorScaleFactorCommand): Promise<number> {
    const res = await this.clientService.getMonitorScaleFactor(destination, (command.variables as MonitorVariables).mid);
    return res.scaleFactor;
  }
}
