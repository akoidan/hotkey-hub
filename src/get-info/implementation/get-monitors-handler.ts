import {Injectable} from '@nestjs/common';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetMonitorsCommand} from '@/config/types/get-commands/get-monitor-commands-schema';

@Injectable()
export class GetMonitorsHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetMonitorsCommand {
    return command.get === 'getMonitors';
  }

  protected async execute(destination: string): Promise<number[]> {
    return this.clientService.monitor.getMonitors(destination);
  }
}
