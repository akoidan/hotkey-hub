import {Injectable} from '@nestjs/common';

import {BaseCommand, GetMonitorInfoCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetMonitorInfoHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetMonitorInfoCommand {
    return command.get === 'getMonitorInfo';
  }

  protected async execute(destination: string, command: GetMonitorInfoCommand): Promise<any> {
    return this.clientService.monitorInfo(destination, command.variables.mid);
  }
}
