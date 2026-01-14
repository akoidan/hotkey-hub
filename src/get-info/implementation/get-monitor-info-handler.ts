import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetMonitorInfoCommand } from '@/config/types/get-commands';

@Injectable()
export class GetMonitorInfoHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetMonitorInfoCommand {
    return command.get === 'getMonitorInfo';
  }

  protected async handleRequest(destination: string, command: GetMonitorInfoCommand): Promise<any> {
    return this.clientService.monitorInfo(destination, command.variables.mid.toString());
  }
}
