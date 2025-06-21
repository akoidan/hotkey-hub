import {Command, FindProcessWindowsCommand} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';
import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';

@Injectable()
export class FindProcessWindowsHandler extends CommandHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: Command): command is FindProcessWindowsCommand {
    return 'findProcessWindows' in command;
  }

  async execute(destination: string, command: FindProcessWindowsCommand): Promise<void> {
    const response = await this.clientService.getProcessWindows(destination, command.findProcessWindows);

    if (command.assignIds) {
      await this.configService.setVariable(command.assignIds, response.wids);
    }
  }
}
