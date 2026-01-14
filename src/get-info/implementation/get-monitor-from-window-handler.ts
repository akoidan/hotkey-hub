import {Injectable} from '@nestjs/common';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetMonitorFromWindowCommand} from '@/config/types/get-commands/get-monitor-commands';

@Injectable()
export class GetMonitorFromWindowHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetMonitorFromWindowCommand {
    return command.get === 'getMonitorFromWindow';
  }

  protected async execute(destination: string, command: GetMonitorFromWindowCommand): Promise<any> {
    return this.clientService.getMonitorFromWindow(destination, command.variables.wid);
  }
}
