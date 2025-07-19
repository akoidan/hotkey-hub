import {ConfigService} from '@/config/config-service';
import {Injectable} from '@nestjs/common';
import {ClientService} from '@/client/client-service';
import {FindProcessesWindowsRemoteCommand, RemoteCommand} from '@/config/types/remote-commands';
import {CommandRemoteHandler} from '@/handlers/command-remote-handler';

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
    const responses = await Promise.all((command.findProcessesWindows as number[])
      .map(async(id) => this.clientService.getProcessWindows(destination, id)));
    if (command.assignIds) {
      for (let i = 0; i < command.findProcessesWindows.length; i++) {
        let id: any = null;
        if (command.pick === 'last') {
          id = responses[i].wids[responses[i].wids.length - 1];
        } else if (command.pick === 'first') {
          // eslint-disable-next-line @typescript-eslint/prefer-destructuring
          id = responses[i].wids[0];
        } else {
          id = responses[i].wids;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.configService.setVariable(command.assignIds[i], id);
      }
    }
  }
}
