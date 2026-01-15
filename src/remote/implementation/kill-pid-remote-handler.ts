import type {KillExeByPidRemoteCommand} from '@/config/types/remote/process-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import type {KillExeByPidRequest} from '@/client/dtos';

export class KillPidRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is KillExeByPidRemoteCommand {
    return command.performOnRemote === 'killExeByPid';
  }

  async execute(destination: string, command: KillExeByPidRemoteCommand): Promise<void> {
    await this.clientService.killExeById(destination, command.variables as KillExeByPidRequest);
  }
}
