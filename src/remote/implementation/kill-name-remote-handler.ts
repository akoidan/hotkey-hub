import {KillExeByNameRemoteCommand, KillExeByNameRemoteVariable} from '@/config/types/remote/process-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class KillNameRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is KillExeByNameRemoteCommand {
    return command.performOnRemote === 'killExeByName';
  }

  async execute(destination: string, command: KillExeByNameRemoteCommand): Promise<void> {
    await this.clientService.killExeByName(destination, command.variables as KillExeByNameRemoteVariable);
  }
}
