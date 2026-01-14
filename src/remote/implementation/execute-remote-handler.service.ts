import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {ExecuteRemoteCommand} from '@/config/types/remote/process-commands';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {LaunchExeRequest} from '@/client/dtos';

@Injectable()
export class ExecuteRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is ExecuteRemoteCommand {
    return command.performOnRemote === 'launchExe';
  }

  async execute(destination: string, command: ExecuteRemoteCommand): Promise<void> {
    const response = await this.clientService.launchExe(destination, command.variables as LaunchExeRequest);

    if (command.assignVariable) {
      this.configService.setVariable(command.assignVariable as string, response.pid);
    }
  }
}
