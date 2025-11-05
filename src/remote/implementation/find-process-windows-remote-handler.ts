import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {FindProcessWindowsRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class FindProcessWindowsRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is FindProcessWindowsRemoteCommand {
    return Boolean((command as FindProcessWindowsRemoteCommand).findProcessWindows);
  }

  async execute(destination: string, command: FindProcessWindowsRemoteCommand): Promise<void> {
    const response = await this.clientService.getProcessWindows(destination, command.findProcessWindows as number);

    if (command.assignIds) {
      await this.configService.setVariable(command.assignIds as string, response.wids);
    }
  }
}
