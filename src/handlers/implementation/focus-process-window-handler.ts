import type {
  Command,
  FocusProcessWindowCommand,
} from '@/config/types/commands';
import {CommandHandler} from '@/handlers/command-handler.service';

export class FocusProcessWindowHandler extends CommandHandler {
  canHandle(command: Command): command is FocusProcessWindowCommand {
    return 'focusPid' in command;
  }

  async execute(destination: string, command: FocusProcessWindowCommand): Promise<void> {
    await this.clientService.focusExe(destination, {pid: command.focusPid as number});
  }
}
