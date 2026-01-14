import type {MouseMoveClickRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {MouseMoveHumanRequest} from '@/client/dtos';

export class MouseClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is MouseMoveClickRemoteCommand {
    return command.performOnRemote === 'mouseMoveClick';
  }

  async execute(destination: string, command: MouseMoveClickRemoteCommand): Promise<void> {
    await this.clientService.mouseMoveHuman(destination, command.variables as MouseMoveHumanRequest);
  }
}
