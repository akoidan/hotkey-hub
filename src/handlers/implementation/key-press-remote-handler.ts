import {RandomService} from '@/random/random-service';
import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';
import {Key, KeyPressRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/handlers/command-remote-handler';

@Injectable()
export class KeyPressRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly randomService: RandomService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is KeyPressRemoteCommand {
    return Boolean((command as KeyPressRemoteCommand).keySend);
  }

  async execute(destination: string, command: KeyPressRemoteCommand): Promise<void> {
    let holdKeys: Key[] = [];
    if (Array.isArray(command.holdKeys)) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      holdKeys = command.holdKeys;
    } else if (command.holdKeys) {
      holdKeys = [command.holdKeys as Key];
    }

    let duration: number | undefined = command.duration;
    if (command.duration && command.durationDiviation) {
      duration = this.randomService.calcDiviation(command.duration, command.durationDiviation);
    }
    await this.clientService.keyPress(destination, {
      keys: (Array.isArray(command.keySend) ? command.keySend : [command.keySend]) as Key[],
      holdKeys,
      duration,
    });
  }
}
