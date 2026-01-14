import type {FocusWindowRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {FocusWindowRequest} from '@/client/dtos';

export class FocusWindowRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is FocusWindowRemoteCommand {
    return command.performOnRemote === 'focusWindow';
  }

  async execute(destination: string, command: FocusWindowRemoteCommand): Promise<void> {
    await this.clientService.focusWindow(destination, command.variables as FocusWindowRequest);
  }
}
