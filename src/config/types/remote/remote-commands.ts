import {z} from 'zod';
import {keyboardCommandsSchema} from '@/config/types/remote/keyboard-commands-schema';
import {mouseCommandsSchema} from '@/config/types/remote/mouse-commands-schema';
import {processCommandsSchema} from '@/config/types/remote/process-commands-schema';
import {windowCommandsSchema} from '@/config/types/remote/window-commands-schema';

const remoteCommandSchema = z.union([
  keyboardCommandsSchema,
  mouseCommandsSchema,
  processCommandsSchema,
  windowCommandsSchema,
]).describe('One of the commands that would be sent to a remote machine specified in destination property');

type RemoteCommand = z.infer<typeof remoteCommandSchema>

export {remoteCommandSchema};

export type {RemoteCommand};