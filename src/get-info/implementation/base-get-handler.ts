import {Injectable, Logger} from '@nestjs/common';
import { ClientService } from '@/client/client-service';
import { ConfigService } from '@/config/config-service';
import { GetInfoHandler } from '../get-info-handler';
import { ExecuteRequestRemoteCommand } from '@/config/types/get-commands';

@Injectable()
export abstract class BaseGetHandler extends GetInfoHandler {
  constructor(
    protected readonly clientService: ClientService,
    protected readonly configService: ConfigService,
    protected readonly logger: Logger,
  ) {
    super(clientService, configService);
  }

  protected abstract handleRequest<T>(destination: string, command: ExecuteRequestRemoteCommand): Promise<T>;

  async execute(destination: string, command: ExecuteRequestRemoteCommand): Promise<void> {
    const result: any = await this.handleRequest(destination, command);
    this.configService.setVariable(command.assignVariable, result);
  }
}
