import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand, GetActiveWindowIdCommand, GetPidsByNameCommand} from '@/config/types/get-commands/get-commands';
import {GetActiveWindowInfoResponse} from '@/client/dtos';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetActiveWindowInfoHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is GetActiveWindowIdCommand {
    return command.get === 'getPidsByName';
  }

  protected async execute(destination: string, command: GetPidsByNameCommand): Promise<unknown> {
    return this.clientService.findPidsByName(destination, {
      name: command.variables.name as string,
    });
  }
}
