import type {LeftMouseClickRemoteCommand} from '@/config/types/remote/mouse-commands-schema';
import type {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class LeftMouseClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is LeftMouseClickRemoteCommand {
    return command.performOnRemote === 'leftMouseClick';
  }

  async execute(destination: string): Promise<void> {
    await this.clientService.mouse.click(destination, {button: 'LEFT'});
  }
}
