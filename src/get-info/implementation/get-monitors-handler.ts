import {Injectable} from '@nestjs/common';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {BaseCommand, GetMonitorsCommand} from '@/config/types/get-commands';

@Injectable()
export class GetMonitorsHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetMonitorsCommand {
    return command.get === 'getMonitors';
  }

  protected async execute(destination: string): Promise<unknown[]> {
    return this.clientService.getMonitors(destination);
  }
}
