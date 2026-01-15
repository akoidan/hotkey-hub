import {Injectable} from '@nestjs/common';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {GetInfoRemoteCommand} from '@/config/types/get-commands/get-commands';
import {GetMonitorFromWindowCommand} from '@/config/types/get-commands/get-monitor-commands-schema';
import {WindowIdVariables} from '@/config/types/get-commands/get-window-commands-schema';

@Injectable()
export class GetMonitorFromWindowHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetMonitorFromWindowCommand {
    return command.get === 'getMonitorFromWindow';
  }

  protected async execute(destination: string, command: GetMonitorFromWindowCommand): Promise<number> {
    const res = await this.clientService.getMonitorFromWindow(destination, (command.variables as WindowIdVariables).wid);
    return res.mid;
  }
}
