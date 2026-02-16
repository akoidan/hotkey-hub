import {Injectable} from '@nestjs/common';
import {GetInfoHandler} from '@/get-info/get-info-handler';
import {GetWindowResponseDto} from '@/client/dtos';
import {GetActiveWindowCommand} from '@/config/types/get-commands/get-window-commands-schema';

@Injectable()
export class GetActiveWindowInfoHandler extends GetInfoHandler {
  canHandle(command: GetActiveWindowCommand): command is GetActiveWindowCommand {
    return command.get === 'getActiveWindow';
  }

  protected async execute(destination: string): Promise<GetWindowResponseDto> {
    return this.clientService.window.getActiveWindowInfo(destination);
  }
}
