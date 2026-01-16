import type {MouseMoveClickRemoteVariable, MouseMoveRemoteCommand} from '@/config/types/remote/mouse-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class MouseMoveRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is MouseMoveRemoteCommand {
    return command.performOnRemote === 'mouseMove';
  }

  async execute(destination: string, command: MouseMoveRemoteCommand): Promise<void> {
    await this.clientService.mouse.mouseMoveHuman(destination, command.variables as MouseMoveClickRemoteVariable);
  }
}
