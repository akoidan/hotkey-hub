import {Injectable} from '@nestjs/common';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {BaseCommand, GetMonitorFromWindowCommand} from '@/config/types/get-commands';

@Injectable()
export class GetMonitorFromWindowHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetMonitorFromWindowCommand {
    return command.get === 'getMonitorFromWindow';
  }

  protected async execute(destination: string, command: GetMonitorFromWindowCommand): Promise<any> {
    return this.clientService.getMonitorFromWindow(destination, command.variables.wid);
  }
}
