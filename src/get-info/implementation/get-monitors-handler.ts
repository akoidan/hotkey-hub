import {Injectable} from '@nestjs/common';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {GetInfoRemoteCommand, GetMonitorsCommand} from '@/config/types/get-commands/get-commands';

@Injectable()
export class GetMonitorsHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetMonitorsCommand {
    return command.get === 'getMonitors';
  }

  protected async execute(destination: string): Promise<unknown[]> {
    return this.clientService.getMonitors(destination);
  }
}
