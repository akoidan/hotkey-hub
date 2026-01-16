import type {MouseMoveClickRemoteCommand, MouseMoveClickRemoteVariable} from '@/config/types/remote/mouse-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class MouseMoveLeftClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is MouseMoveClickRemoteCommand {
    return command.performOnRemote === 'mouseMoveLeftClick';
  }

  async execute(destination: string, command: MouseMoveClickRemoteCommand): Promise<void> {
    await this.clientService.mouseMoveHuman(destination, command.variables as MouseMoveClickRemoteVariable);
  }
}
