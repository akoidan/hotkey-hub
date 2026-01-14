import type {TypeTextRemoteCommand} from '@/config/types/remote/keyboard-commands';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import type {TypeTextRequest} from '@/client/dtos';

export class TypeTextRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is TypeTextRemoteCommand {
    return command.performOnRemote === 'typeText';
  }

  async execute(destination: string, command: TypeTextRemoteCommand): Promise<void> {
    await this.clientService.typeText(destination, command.variables as TypeTextRequest);
  }
}
