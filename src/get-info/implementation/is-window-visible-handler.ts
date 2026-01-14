import {Injectable} from '@nestjs/common';

import {BaseCommand, IsWindowVisibleCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class IsWindowVisibleHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is IsWindowVisibleCommand {
    return command.get === 'isWindowVisible';
  }

  protected async execute(destination: string, command: IsWindowVisibleCommand): Promise<boolean> {
    return this.clientService.isWindowVisible(destination, command.variables.wid);
  }
}
