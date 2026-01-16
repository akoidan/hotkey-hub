import {RandomService} from '@/random/random-service';
import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';
import {Key, KeyPressRemoteCommand} from '@/config/types/remote/keyboard-commands-schema';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class KeyPressRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly randomService: RandomService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is KeyPressRemoteCommand {
    return command.performOnRemote === 'keyPress';
  }

  async execute(destination: string, command: KeyPressRemoteCommand): Promise<void> {
    let holdKeys: Key[] = [];
    if (Array.isArray(command.variables.holdKeys)) {
      holdKeys = command.variables.holdKeys as Key[];
    } else if (command.variables.holdKeys) {
      holdKeys = [command.variables.holdKeys as Key];
    }

    let duration: number | undefined = command.variables.duration as number | undefined;
    if (command.variables.duration && command.variables.durationDeviation) {
      duration = this.randomService.calcDeviation(command.variables.duration as number, command.variables.durationDeviation as number);
    }
    await this.clientService.keyPress(destination, {
      keys: Array.isArray(command.variables.key) ? command.variables.key as Key[] : [command.variables.key as Key],
      holdKeys,
      duration,
    });
  }
}
