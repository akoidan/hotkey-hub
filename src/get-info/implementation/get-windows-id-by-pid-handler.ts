import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { GetWindowsIdByPidCommand } from '@/config/types/get-commands';

@Injectable()
export class GetWindowsIdByPidHandler extends BaseGetHandler {
  canHandle(command: any): command is GetWindowsIdByPidCommand {
    return command.get === 'getWindowsIdByPid' && !!command.variables?.id;
  }

  protected async handleRequest(destination: string, command: GetWindowsIdByPidCommand): Promise<number[]> {
    return this.clientService.getProcessWindows(destination, command.variables.id);
  }
}
