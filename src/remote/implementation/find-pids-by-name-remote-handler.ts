import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {FindPidsByNameRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class FindPidsByNameRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is FindPidsByNameRemoteCommand {
    return Boolean((command as FindPidsByNameRemoteCommand).findPidsByName);
  }

  async execute(destination: string, command: FindPidsByNameRemoteCommand): Promise<void> {
    const response = await this.clientService.findPidsByName(destination, {
      name: command.findPidsByName as string,
    });

    if (command.assignIds) {
      this.configService.setVariable(command.assignIds as string, response.pids);
    }
  }
}
