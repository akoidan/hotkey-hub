import {FocusWindowRemoteCommand, FocusWindowRemoteVariable} from '@/config/types/remote/window-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class FocusWindowRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is FocusWindowRemoteCommand {
    return command.performOnRemote === 'focusWindow';
  }

  async execute(destination: string, command: FocusWindowRemoteCommand): Promise<void> {
    await this.clientService.window.setWindowActive(destination, (command.variables as FocusWindowRemoteVariable).wid);
  }
}
