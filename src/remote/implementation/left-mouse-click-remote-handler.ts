import {LeftMouseClickRemoteCommand} from '@/config/types/remote/mouse-commands';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class LeftMouseClickRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is LeftMouseClickRemoteCommand {
    return command.performOnRemote === 'leftMouseClick';
  }

  async execute(destination: string): Promise<void> {
    await this.clientService.leftMouseClick(destination);
  }
}
