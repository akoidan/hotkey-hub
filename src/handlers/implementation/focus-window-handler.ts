import type {Command, FocusWindowCommand} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class FocusWindowHandler extends CommandHandler {
  canHandle(command: Command): command is FocusWindowCommand {
    return 'focusWid' in command;
  }

  async execute(destination: string, command: FocusWindowCommand): Promise<void> {
    await this.clientService.focusWindow(destination, {wid: command.focusWid as number});
  }
}
