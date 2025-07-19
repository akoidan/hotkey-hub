import type {LeftMouseClickRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/handlers/command-remote-handler';

export class LeftMouseClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is LeftMouseClickRemoteCommand {
    return Boolean((command as LeftMouseClickRemoteCommand).leftMouseClick);
  }

  async execute(destination: string): Promise<void> {
    await this.clientService.leftMouseClick(destination);
  }
}
