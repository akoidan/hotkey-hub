import {Injectable} from '@nestjs/common';
import {GetWindowCommand, WindowIdVariables} from '@/config/types/get-commands/get-window-commands-schema';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {GetWindowResponseDto} from '@/client/dtos';

@Injectable()
export class GetWindowInfoHandler extends GetInfoHandler {
  canHandle(command: GetWindowCommand): command is GetWindowCommand {
    return command.get === 'getWindow';
  }

  protected async execute(destination: string,  command: GetWindowCommand): Promise<GetWindowResponseDto> {
    return this.clientService.window.getWindowInfo(destination, (command.variables as WindowIdVariables).wid);
  }
}
