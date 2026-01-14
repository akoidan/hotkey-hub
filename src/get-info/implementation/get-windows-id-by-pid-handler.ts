import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { BaseGetHandler } from './base-get-handler';
import { BaseCommand, GetWindowsIdByPidCommand } from '@/config/types/get-commands';

@Injectable()
export class GetWindowsIdByPidHandler extends BaseGetHandler {
  canHandle(command: BaseCommand): command is GetWindowsIdByPidCommand {
    return command.get === 'getWindowsIdByPid';
  }

  protected async handleRequest(destination: string, command: GetWindowsIdByPidCommand): Promise<number[]> {
    const res = await this.clientService.getProcessWindows(destination, command.variables.id);
    return res.wids;
  }
}
