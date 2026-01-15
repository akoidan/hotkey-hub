import {z, type ZodType} from 'zod';
import {type RemoteCommand, remoteCommandSchema} from '@/config/types/remote/remote-commands';
import {type GetInfoRemoteCommand, getInfoCommandSchema} from '@/config/types/get-commands/get-commands';
import {type LocalCommand, localCommandSchema} from '@/config/types/local/local-commands';


const unknownCommandSchema = z.lazy(() => z.union([
  remoteCommandSchema,
  getInfoCommandSchema,
  localCommandSchema,
])).describe('A command that would be executed on this machine') as ZodType<UnknownCommand>;


type UnknownCommand = RemoteCommand
  | GetInfoRemoteCommand
  | LocalCommand


export {unknownCommandSchema};

export type {UnknownCommand};

