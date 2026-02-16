import {Injectable} from '@nestjs/common';
import {
  GetPidsByNameCommand,
  GetPidsByNameCommandVariables,
} from '@/config/types/get-commands/get-process-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';

@Injectable()
export class GetPidsByNameHandler extends GetInfoHandler {
  canHandle(command: GetPidsByNameCommand): command is GetPidsByNameCommand {
    return command.get === 'getPidsByName';
  }

  protected async execute(destination: string, command: GetPidsByNameCommand): Promise<number[]> {
    return this.clientService.process.findPidByName(destination, (command.variables as GetPidsByNameCommandVariables).name);
  }
}
