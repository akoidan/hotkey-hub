import type {FocusProcessWindowRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class FocusProcessWindowRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is FocusProcessWindowRemoteCommand {
    return Boolean((command as FocusProcessWindowRemoteCommand).focusPid);
  }

  async execute(destination: string, command: FocusProcessWindowRemoteCommand): Promise<void> {
    await this.clientService.focusExe(destination, {pid: command.focusPid as number});
  }
}
