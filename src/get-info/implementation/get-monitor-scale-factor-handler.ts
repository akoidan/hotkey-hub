import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetMonitorScaleFactorCommand } from '@/config/types/get-commands';

@Injectable()
export class GetMonitorScaleFactorHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetMonitorScaleFactorCommand {
    return command.get === 'getMonitorScaleFactor';
  }

  protected async handleRequest(destination: string, command: GetMonitorScaleFactorCommand): Promise<number> {
    return this.clientService.getMonitorScaleFactor(destination, command.variables.mid);
  }
}
