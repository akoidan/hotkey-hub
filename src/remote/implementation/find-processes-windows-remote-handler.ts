import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {FindProcessesWindowsRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

@Injectable()
export class FindProcessesWindowsRemoteHandler extends CommandRemoteHandler {
  constructor(
    clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    super(clientService);
  }

  canHandle(command: RemoteCommand): command is FindProcessesWindowsRemoteCommand {
    return Boolean((command as FindProcessesWindowsRemoteCommand).findProcessesWindows);
  }

  async execute(destination: string, command: FindProcessesWindowsRemoteCommand): Promise<void> {
    if (command.assignIds && (command.findProcessesWindows as number[]).length !== (command.assignIds as string[]).length) {
      throw new Error(`Unable to execute findProcessesWindows, on ${destination}` +
        ` since  ${JSON.stringify(command.findProcessesWindows)} cannot be assigned to a` +
        `different number of variables: ${JSON.stringify(command.assignIds)}`);
    }
    const responses = await Promise.all((command.findProcessesWindows as number[])
      .map(async(id) => this.clientService.getProcessWindows(destination, id)));
    if (command.assignIds) {
      for (let i = 0; i < (command.findProcessesWindows as number[]).length; i++) {
        await this.configService.setVariable((command.assignIds as string[])[i], responses[i].wids);
      }
    }
  }
}
