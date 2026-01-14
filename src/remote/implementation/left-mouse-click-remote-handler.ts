import type {LeftMouseClickRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class LeftMouseClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is LeftMouseClickRemoteCommand {
    return command.performOnRemote === 'leftMouseClick';
  }

  async execute(destination: string): Promise<void> {
    await this.clientService.leftMouseClick(destination);
  }
}
