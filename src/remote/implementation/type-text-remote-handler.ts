import type {RemoteCommand, TypeTextRemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {TypeTextRequest} from '@/client/dtos';

export class TypeTextRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is TypeTextRemoteCommand {
    return command.performOnRemote === 'typeText';
  }

  async execute(destination: string, command: TypeTextRemoteCommand): Promise<void> {
    await this.clientService.typeText(destination, command.variables as TypeTextRequest);
  }
}
