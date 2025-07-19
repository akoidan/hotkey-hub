import type {RemoteCommand, TypeTextRemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/handlers/command-remote-handler';

export class TypeTextRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is TypeTextRemoteCommand {
    return Boolean((command as TypeTextRemoteCommand).typeText);
  }

  async execute(destination: string, command: TypeTextRemoteCommand): Promise<void> {
    await this.clientService.typeText(destination, {text: command.typeText});
  }
}
