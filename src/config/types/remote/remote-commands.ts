import {z} from 'zod';
import {keyPressRemoteCommandSchema, typeTextRemoteCommandSchema} from '@/config/types/remote/keyboard-commands';
import {
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  setWindowBoundsRemoteSchema
} from '@/config/types/remote/window-commands';
import {leftMouseClickRemoteCommandSchema, mouseMoveClickRemoteCommandSchema} from '@/config/types/remote/mouse-commands';
import {
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  launchExeRemoteCommandSchema
} from '@/config/types/remote/process-commands';

const remoteCommandSchema = z.union([
  keyPressRemoteCommandSchema,
  setWindowBoundsRemoteSchema,
  leftMouseClickRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
]).describe('One of the commands that would be sent to a remote machine specified in destination property');


type RemoteCommand = z.infer<typeof remoteCommandSchema>

export {remoteCommandSchema}

export type {RemoteCommand}