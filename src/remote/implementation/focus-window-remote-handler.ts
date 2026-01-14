import type {FocusWindowRemoteCommand} from '@/config/types/remote/window-commands';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import type {FocusWindowRequest} from '@/client/dtos';

export class FocusWindowRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is FocusWindowRemoteCommand {
    return command.performOnRemote === 'focusWindow';
  }

  async execute(destination: string, command: FocusWindowRemoteCommand): Promise<void> {
    await this.clientService.focusWindow(destination, command.variables as FocusWindowRequest);
  }
}
