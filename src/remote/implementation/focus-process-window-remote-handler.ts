import {FocusProcessWindowRemoteCommand} from '@/config/types/remote/window-commands';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import type {FocusExeRequest} from '@/client/dtos';

export class FocusProcessWindowRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is FocusProcessWindowRemoteCommand {
    return command.performOnRemote === 'focusProcessWindow';
  }

  async execute(destination: string, command: FocusProcessWindowRemoteCommand): Promise<void> {
    await this.clientService.focusExe(destination, command.variables as FocusExeRequest);
  }
}
