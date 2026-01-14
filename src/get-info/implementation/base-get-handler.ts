import { Injectable } from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { GetInfoHandler } from '../get-info-handler';
import { ExecuteRequestRemoteCommand } from '@/config/types/get-commands';

@Injectable()
export abstract class BaseGetHandler extends GetInfoHandler {
  constructor(
    protected readonly clientService: ClientService,
    protected readonly configService: ConfigService,
  ) {
    super(clientService, configService);
  }

  protected abstract handleRequest(destination: string, command: ExecuteRequestRemoteCommand): Promise<any>;

  async execute(destination: string, command: ExecuteRequestRemoteCommand): Promise<void> {
    const result = await this.handleRequest(destination, command);
    if (command.assignVariable) {
      this.configService.setVariable(command.assignVariable, result);
    }
  }
}
