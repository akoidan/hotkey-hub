import {
  Command,
  ExecuteCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';
import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import { SemaphorService } from '@/semaphor/semaphor-service';

@Injectable()
export class ExecuteHandler extends CommandHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
    private readonly semaphoreSerivce: SemaphorService,
  ) {
    super(clientService, semaphoreSerivce);
  }

  canHandle(command: Command): command is ExecuteCommand {
    return 'launch' in command;
  }

  async execute(destination: string, command: ExecuteCommand): Promise<void> {
    const response = await this.clientService.launchExe(destination, {
      path: command.launch,
      arguments: command.arguments ?? [],
      waitTillFinish: command.waitTillFinish ?? false,
    });

    if (command.assignId) {
      await this.configService.setVariable(command.assignId, response.pid);
    }
  }
}
