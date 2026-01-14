import {Injectable} from '@nestjs/common';

import {BaseCommand, GetWindowBoundsCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowBoundsHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetWindowBoundsCommand {
    return command.get === 'getWindowBounds';
  }

  protected async execute(destination: string, command: GetWindowBoundsCommand): Promise<any> {
    return this.clientService.getWindowBounds(destination, command.variables.wid);
  }
}
