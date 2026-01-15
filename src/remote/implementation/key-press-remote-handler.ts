import {RandomService} from '@/random/random-service';
import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';
import {Key, KeyPressRemoteCommand, KeyPressRemoteVariable} from '@/config/types/remote/keyboard-commands-schema';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {SendKeyRequest} from '@/client/dtos';

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
    const vars = command.variables as KeyPressRemoteVariable;
    let duration: number|undefined = vars.duration;
    if (vars.duration && vars.durationDeviation) {
      duration = this.randomService.calcDeviation(vars.duration as number, vars.durationDeviation as number);
    }
    let holdKeys: Key[] = [];
    if (Array.isArray(vars.holdKeys)) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      holdKeys = vars.holdKeys
    } else if (typeof vars.holdKeys !== 'undefined') {
      holdKeys = [vars.holdKeys]
    }
    const newVars: SendKeyRequest = {
      keys: Array.isArray(vars.key) ? vars.key : [vars.key],
      holdKeys,
      duration,
    };
    await this.clientService.keyPress(destination, newVars);
  }
}
