import type {MouseMoveClickRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class MouseClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is MouseMoveClickRemoteCommand {
    return Boolean((command as MouseMoveClickRemoteCommand).mouseMoveX);
  }

  async execute(destination: string, command: MouseMoveClickRemoteCommand): Promise<void> {
    await this.clientService.mouseMoveClick(destination, {
      x: command.mouseMoveX as number,
      y: command.mouseMoveY as number,
    });
  }
}
