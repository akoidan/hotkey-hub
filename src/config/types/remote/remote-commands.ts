import {z} from 'zod';
import {keyboardCommands} from '@/config/types/remote/keyboard-commands';
import {mouseCommands} from '@/config/types/remote/mouse-commands';
import {processCommands} from '@/config/types/remote/process-commands';
import {windowCommands} from '@/config/types/remote/window-commands';

const remoteCommandSchema = z.union([
  keyboardCommands,
  mouseCommands,
  processCommands,
  windowCommands,
]).describe('One of the commands that would be sent to a remote machine specified in destination property');

type RemoteCommand = z.infer<typeof remoteCommandSchema>

export {remoteCommandSchema};

export type {RemoteCommand};