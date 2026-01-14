import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {ExecuteRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class ExecuteRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is ExecuteRemoteCommand {
    return Boolean((command as ExecuteRemoteCommand).launch);
  }

  async execute(destination: string, command: ExecuteRemoteCommand): Promise<void> {
    const response = await this.clientService.launchExe(destination, {
      path: command.launch as string,
      arguments: command.arguments as string[] ?? [],
      waitTillFinish: command.waitTillFinish as boolean ?? false,
    });

    if (command.assignId) {
      this.configService.setVariable(command.assignId as string, response.pid);
    }
  }
}
