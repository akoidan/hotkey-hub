import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { GetMonitorsCommand } from '@/config/types/get-commands';

@Injectable()
export class GetMonitorsHandler extends BaseGetHandler {
  canHandle(command: any): command is GetMonitorsCommand {
    return command.get === 'getMonitors';
  }

  protected async handleRequest(destination: string): Promise<any[]> {
    return this.clientService.getMonitors(destination);
  }
}
