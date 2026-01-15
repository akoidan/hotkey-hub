import {Injectable} from '@nestjs/common';
import {SetWindowBoundsRemoteCommand} from '@/config/types/remote/window-commands-schema';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {SetWindowBoundsRequest} from '@/client/dtos';

@Injectable()
export class SetWindowBoundsRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is SetWindowBoundsRemoteCommand {
    return command.performOnRemote === 'setWindowBounds';
  }

  async execute(destination: string, command: SetWindowBoundsRemoteCommand): Promise<void> {
    await this.clientService.setWindowBounds(destination, command.variables as unknown as SetWindowBoundsRequest);
  }
}
