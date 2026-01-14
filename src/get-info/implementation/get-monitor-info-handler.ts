import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { GetMonitorInfoCommand } from '@/config/types/get-commands';

@Injectable()
export class GetMonitorInfoHandler extends BaseGetHandler {
  canHandle(command: any): command is GetMonitorInfoCommand {
    return command.get === 'getMonitorInfo' && !!command.variables?.mid;
  }

  protected async handleRequest(destination: string, command: GetMonitorInfoCommand): Promise<any> {
    return this.clientService.monitorInfo(destination, command.variables.mid.toString());
  }
}
