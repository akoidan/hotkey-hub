import type {MouseMoveClickRemoteCommand} from '@/config/types/remote/mouse-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import type {MouseMoveHumanRequest} from '@/client/dtos';

export class MouseClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is MouseMoveClickRemoteCommand {
    return command.performOnRemote === 'mouseMoveClick';
  }

  async execute(destination: string, command: MouseMoveClickRemoteCommand): Promise<void> {
    await this.clientService.mouseMoveHuman(destination, command.variables as MouseMoveHumanRequest);
  }
}
