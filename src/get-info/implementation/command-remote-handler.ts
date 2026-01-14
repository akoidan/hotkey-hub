import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {FindProcessWindowsRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';
import {ExecuteRequestRemoteCommand} from '@/config/types/get-commands';

@Injectable()
export class ExecuteGetRequestRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: ExecuteRequestRemoteCommand): command is ExecuteRequestRemoteCommand {
    return Boolean((command as ExecuteRequestRemoteCommand).get);
  }

  async execute(destination: string, command: ExecuteRequestRemoteCommand): Promise<void> {
    const response = await this.clientService.getProcessWindows(destination, );

    this.configService.setVariable(command.assignVariable as string, response.wids);
  }
}
