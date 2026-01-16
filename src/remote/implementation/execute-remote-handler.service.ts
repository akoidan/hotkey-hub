import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {LaunchExeRemoteCommand, LaunchExeRemoteVariable} from '@/config/types/remote/process-commands-schema';
import {RemoteCommand} from '@/config/types/remote/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class ExecuteRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is LaunchExeRemoteCommand {
    return command.performOnRemote === 'launchExe';
  }

  async execute(destination: string, command: LaunchExeRemoteCommand): Promise<void> {
    const response = await this.clientService.process.launchExe(destination, command.variables as LaunchExeRemoteVariable);

    if (command.assignVariable) {
      this.configService.setVariable(command.assignVariable as string, response.pid);
    }
  }
}
