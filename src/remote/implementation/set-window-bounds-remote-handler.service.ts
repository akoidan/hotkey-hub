import {Injectable} from '@nestjs/common';
import {
  SetWindowBoundsRemoteCommand,
  SetWindowBoundsRemoteVariable,
  WindowProperties,
} from '@/config/types/remote/window-commands-schema';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class SetWindowBoundsRemoteHandler extends CommandRemoteHandler {
  canHandle(command: RemoteCommand): command is SetWindowBoundsRemoteCommand {
    return command.performOnRemote === 'setWindowBounds';
  }

  async execute(destination: string, command: SetWindowBoundsRemoteCommand): Promise<void> {
    const variables = command.variables as SetWindowBoundsRemoteVariable;
    await this.clientService.window.setWindowProperties(
      destination,
      variables.wid,
      {bounds: (variables.bounds as WindowProperties)},
    );
  }
}
