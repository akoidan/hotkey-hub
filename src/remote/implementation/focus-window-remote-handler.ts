import type {FocusWindowRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class FocusWindowRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is FocusWindowRemoteCommand {
    return Boolean((command as FocusWindowRemoteCommand).focusWid);
  }

  async execute(destination: string, command: FocusWindowRemoteCommand): Promise<void> {
    await this.clientService.focusWindow(destination, {wid: command.focusWid as number});
  }
}
