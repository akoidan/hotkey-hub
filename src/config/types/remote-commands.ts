/* eslint-disable max-lines*/
import {z, ZodIssueCode, ZodObject} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import type {ConfigDataWoMacro} from '@/config/types/schema';
import {type VariableValue, variableValueSchema} from '@/config/types/variables';









type TypeTextRemoteCommand = z.infer<typeof typeTextRemoteCommandSchema>
type FocusProcessWindowRemoteCommand = z.infer<typeof focusProcessWindowRemoteCommandSchema>
type FocusWindowRemoteCommand = z.infer<typeof focusWindowRemoteCommandSchema>
type KeyPressRemoteCommand = z.infer<typeof keyPressRemoteCommandSchema>
type SetWindowBoundsRemoteCommand = z.infer<typeof setWindowBoundsRemoteSchema>
type BaseRemoteCommand = z.infer<typeof baseRemoteCommandSchema>
type MouseMoveClickRemoteCommand = z.infer<typeof mouseMoveClickRemoteCommandSchema>
type LeftMouseClickRemoteCommand = z.infer<typeof leftMouseClickRemoteCommandSchema>
type ExecuteRemoteCommand = z.infer<typeof launchExeRemoteCommandSchema>
type RemoteCommand = z.infer<typeof remoteCommandSchema>
type Key = z.infer<typeof keySchema>;
type KillExeByPidRemoteCommand = z.infer<typeof killExeByPidRemoteCommandSchema>
type KillExeByNameRemoteCommand = z.infer<typeof killExeByNameRemoteCommandSchema>
type Delay = z.infer<typeof delayCommandsSchema>;

