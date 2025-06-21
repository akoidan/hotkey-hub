import {Command, FindPidsByNameCommand} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';
import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';

@Injectable()
export class FindPidsByNameHandler extends CommandHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: Command): command is FindPidsByNameCommand {
    return 'findPidsByName' in command;
  }

  async execute(destination: string, command: FindPidsByNameCommand): Promise<void> {
    const response = await this.clientService.findPidsByName(destination, {
      name: command.findPidsByName,
    });

    if (command.assignIds) {
      await this.configService.setVariable(command.assignIds, response.pids);
    }
  }
}
