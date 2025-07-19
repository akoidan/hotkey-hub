import type {KillExeByNameRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/handlers/command-remote-handler';

export class KillNameRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is KillExeByNameRemoteCommand {
    return Boolean((command as KillExeByNameRemoteCommand).killByName);
  }

  async execute(destination: string, command: KillExeByNameRemoteCommand): Promise<void> {
    await this.clientService.killExeByName(destination, {name: command.killByName});
  }
}
