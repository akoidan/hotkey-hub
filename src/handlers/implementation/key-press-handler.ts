import type {Command, Key, KeyPressCommand} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';
import {RandomService} from '@/random/random-service';
import {ClientService} from '@/client/client-service';
import {Injectable} from '@nestjs/common';

@Injectable()
export class KeyPressHandler extends CommandHandler {
  constructor(
    clientService: ClientService,
    private readonly randomService: RandomService,
  ) {
    super(clientService);
  }
  canHandle(command: Command): command is KeyPressCommand {
    return 'keySend' in command;
  }

  async execute(destination: string, command: KeyPressCommand): Promise<void> {
    let holdKeys: Key[] = [];
    if (Array.isArray(command.holdKeys)) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      holdKeys = command.holdKeys;
    } else if (command.holdKeys) {
      holdKeys = [command.holdKeys as Key];
    }

    let duration: number|undefined = command.duration;
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
