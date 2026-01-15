import {z} from 'zod';
import {keyboardAllSchemas} from '@/config/types/remote/keyboard-commands';
import {mouseAllSchemas} from '@/config/types/remote/mouse-commands';
import {processAllSchemas} from '@/config/types/remote/process-commands';
import {windowAllSchemas} from '@/config/types/remote/window-commands';

const remoteCommandSchema = z.union([
  keyboardAllSchemas,
  mouseAllSchemas,
  processAllSchemas,
  windowAllSchemas,
]).describe('One of the commands that would be sent to a remote machine specified in destination property');

type RemoteCommand = z.infer<typeof remoteCommandSchema>

export {remoteCommandSchema};

export type {RemoteCommand};