import {RandomService} from '@/random/random-service';
import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';
import {Key, KeyPressRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
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
    return Boolean((command as KeyPressRemoteCommand).keyPress);
  }

  async execute(destination: string, command: KeyPressRemoteCommand): Promise<void> {
    let holdKeys: Key[] = [];
    if (Array.isArray(command.holdKeys)) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      holdKeys = command.holdKeys;
    } else if (command.holdKeys) {
      holdKeys = [command.holdKeys];
    }

    let duration: number | undefined = command.duration;
    if (command.duration && command.durationDeviation) {
      duration = this.randomService.calcDeviation(command.duration, command.durationDeviation);
    }
    await this.clientService.keyPress(destination, {
      keys: Array.isArray(command.keyPress) ? command.keyPress : [command.keyPress],
      holdKeys,
      duration,
    });
  }
}
