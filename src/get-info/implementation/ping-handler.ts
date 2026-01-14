import {Injectable} from '@nestjs/common';

import {GetInfoRemoteCommand, PingCommand} from '@/config/types/get-commands/get-commands';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class PingHandler extends GetInfoHandler {
  canHandle(command: GetInfoRemoteCommand): command is PingCommand {
    return command.get === 'ping';
  }

  protected async execute(destination: string): Promise<boolean> {
    try {
      await this.clientService.ping(destination);
      return true;
    } catch (e) {
      this.logger.error(`Unable ping ${destination}, because of ${e?.message || e}`, e.stack);
      return false;
    }
  }
}
