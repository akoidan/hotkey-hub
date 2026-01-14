import {Injectable} from '@nestjs/common';

import {BaseCommand, GetWindowTitleCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowTitleHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetWindowTitleCommand {
    return command.get === 'getWindowTitle';
  }

  protected async execute(destination: string, command: GetWindowTitleCommand): Promise<string> {
    return this.clientService.getWindowTitle(destination, command.variables.wid);
  }
}
