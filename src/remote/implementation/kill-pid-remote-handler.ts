import type {KillExeByPidRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {KillExeByPidRequest} from '@/client/dtos';

export class KillPidRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is KillExeByPidRemoteCommand {
    return command.performOnRemote === 'killExeByPid';
  }

  async execute(destination: string, command: KillExeByPidRemoteCommand): Promise<void> {
    await this.clientService.killExeById(destination, command.variables as KillExeByPidRequest);
  }
}
