import {Injectable} from '@nestjs/common';
import {RemoteCommand, SetWindowBoundsRemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class SetWindowBoundsRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is SetWindowBoundsRemoteCommand {
    return Boolean((command as SetWindowBoundsRemoteCommand).setWindowIdBound);
  }

  async execute(destination: string, command: SetWindowBoundsRemoteCommand): Promise<void> {
    await this.clientService.setWindowBounds(destination, {
      wid: command.setWindowIdBound as number,
      bounds: command.windowProperties,
    });
  }
}
