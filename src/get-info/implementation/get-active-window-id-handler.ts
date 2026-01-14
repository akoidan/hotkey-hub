import {Injectable} from '@nestjs/common';

import {BaseCommand, GetActiveWindowCommand} from '@/config/types/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetActiveWindowIdHandler extends GetInfoHandler {
  canHandle(command: BaseCommand): command is GetActiveWindowCommand {
    return command.get === 'getActiveWindow';
  }

  protected async execute(destination: string): Promise<unknown> {
    return this.clientService.getActiveWindowId(destination);
  }
}
