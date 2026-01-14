import {Injectable} from '@nestjs/common';

import {BaseCommand, IsWindowCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class IsWindowHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is IsWindowCommand {
    return command.get === 'isWindow';
  }

  protected async execute(destination: string, command: IsWindowCommand): Promise<boolean> {
    return this.clientService.isWindow(destination, command.variables.wid);
  }
}
