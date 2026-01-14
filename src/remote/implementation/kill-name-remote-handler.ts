import {KillExeByNameRemoteCommand} from '@/config/types/remote/process-commands';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {KillExeByNameRequest} from '@/client/dtos';

export class KillNameRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is KillExeByNameRemoteCommand {
    return command.performOnRemote === 'killExeByName';
  }

  async execute(destination: string, command: KillExeByNameRemoteCommand): Promise<void> {
    await this.clientService.killExeByName(destination, command.variables as KillExeByNameRequest);
  }
}
