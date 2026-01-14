import {Injectable} from '@nestjs/common';

import {BaseCommand, GetWindowOpacityCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowOpacityHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetWindowOpacityCommand {
    return command.get === 'getWindowOpacity';
  }

  protected async execute(destination: string, command: GetWindowOpacityCommand): Promise<number> {
    return this.clientService.getWindowOpacity(destination, command.variables.wid);
  }
}
