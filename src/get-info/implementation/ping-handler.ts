import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, PingCommand } from '@/config/types/get-commands';

@Injectable()
export class PingHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is PingCommand {
    return command.get === 'ping';
  }

  protected async handleRequest(destination: string): Promise<boolean> {
    try {
      await this.clientService.ping(destination);
      return true;
    } catch (e) {
      this.logger.error(`Unable ping ${destination}, because of ${e?.message || e}`, e.stack);
      return false;
    }
  }
}
