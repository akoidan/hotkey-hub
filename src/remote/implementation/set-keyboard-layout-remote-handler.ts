import type {
  KeyboardLayoutVariables,
  SetKeyboardLayoutRemoteCommand,
} from '@/config/types/remote/keyboard-commands-schema';
import {CommandRemoteHandler} from '@/remote/command-remote-handler';

export class SetKeyboardLayoutRemoteHandler extends CommandRemoteHandler {
  canHandle(command: SetKeyboardLayoutRemoteCommand): command is SetKeyboardLayoutRemoteCommand {
    return command.performOnRemote === 'setKeyboardLayout';
  }

  async execute(destination: string, command: SetKeyboardLayoutRemoteCommand): Promise<void> {
    await this.clientService.keyboard.setLayout(destination, command.variables as KeyboardLayoutVariables);
  }
}
