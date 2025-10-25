import type {KillExeByPidRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class KillPidRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is KillExeByPidRemoteCommand {
    return Boolean((command as KillExeByPidRemoteCommand).killByPid);
  }

  async execute(destination: string, command: KillExeByPidRemoteCommand): Promise<void> {
    if (!command.killByPid) {
      throw new Error(`Unable to kill a process in ${destination}, since variable resolved to undefined`);
    }
    await this.clientService.killExeById(destination, {pid: command.killByPid});
  }
}
