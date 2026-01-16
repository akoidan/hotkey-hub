import type {FocusProcessWindowRemoteCommand, FocusProcessWindowRemoteVariable} from '@/config/types/remote/window-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class FocusProcessWindowRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is FocusProcessWindowRemoteCommand {
    return command.performOnRemote === 'focusProcessWindow';
  }

  async execute(destination: string, command: FocusProcessWindowRemoteCommand): Promise<void> {
    await this.clientService.window.focusExe(destination, command.variables as FocusProcessWindowRemoteVariable);
  }
}
