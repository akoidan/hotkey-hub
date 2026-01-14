import {Injectable} from '@nestjs/common';

import {BaseCommand, GetWindowOwnerCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetWindowOwnerHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetWindowOwnerCommand {
    return command.get === 'getWindowOwner';
  }

  protected async execute(destination: string, command: GetWindowOwnerCommand): Promise<any> {
    return this.clientService.getWindowOwner(destination, command.variables.wid);
  }
}
