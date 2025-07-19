/* eslint-disable max-lines*/
import {
  z,
  ZodIssueCode,
} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import type {ConfigDataWoMacro} from '@/config/types/schema';
import {
  variableRegex,
  variableValueSchema,
} from '@/config/types/variables';

// import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';
// const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()] as string[];
// eslint-disable-next-line  max-len
const keySchema = z.enum(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space', 'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd', 'menu', 'fn', 'shift', 'command', 'right_shift', 'command', '`', '-', '=', 'backspace', '[', ']', '\\', ';', '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end', 'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'enter', 'caps_lock', 'scroll_lock', 'num_lock', 'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random']).describe('A key to be sent.');

const delayCommandsSchema = z.object({
  delayAfter: z.union([z.number(), variableValueSchema]).optional()
    .describe('Delay in milliseconds before the next command. So this command can finish execution'),
  delayBefore: z.union([z.number(), variableValueSchema]).optional()
    .describe('Delay in milliseconds before the next command. So this command can finish execution'),
}).strict();

const baseSchema = z.object({
  destination: z.union([z.string().superRefine((destination, ctx) => {
    const data: ConfigDataWoMacro = schemaRootCache.data ?? {ips: {}};
    const ipsKeys = new Set(Object.keys(data.ips ?? {}));

    if (!data.ips[destination] && !variableRegex.test(destination)) {
      const allOptions = JSON.stringify(Array.from(ipsKeys));
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['destination'],
        message: `"${destination}" is not a valid destination, possible options are ${allOptions}`,
      });
    }
  }), variableValueSchema]).describe('Remote PC from ips or aliases section to send this command to'),
}).strict().merge(delayCommandsSchema);


const keyPressRemoteCommandSchema = z.object({
  keySend: z.union([keySchema, variableValueSchema, z.array(keySchema)])
    .describe('Key that will be pressed'),
  duration: z.number().min(50).optional().describe('duration of key being pressed'),
  durationDiviation: z.number().default(0).optional().describe('Controlls randomness of duration'),
  holdKeys: z.union([keySchema, variableValueSchema, z.array(keySchema)])
    .optional()
    .describe('Keys that will be hold during pressing main key. E.g if you need to send Alt+1, here goes Alt'),
}).strict().merge(baseSchema).describe('Sends a key press event (like you pressed on a keyboard) to a remote PC.');

const launchExeRemoteCommandSchema = z.object({
  launch: z.string().describe('Full path to an executable.'),
  arguments: z.array(z.string()).optional().describe('Array of arguments to an executable'),
  waitTillFinish: z.boolean().optional().describe('Waits until executable finishes to run before running the next command'),
  assignId: z.string().optional().describe('Assigns PID of launched command to a variable that can be used after'),
}).strict().merge(baseSchema).describe('Starts a program on a remote PC.');

const focusProcessWindowRemoteCommandSchema = z.object({
  focusPid: z.union([variableValueSchema, z.number()]).describe('Pid of the process that has this window'),
}).strict().merge(baseSchema).describe('Focuses window with the provided PID, making it active');

const focusWindowRemoteCommandSchema = z.object({
  focusWid: z.union([variableValueSchema, z.number()]).describe('Windows Id to focus'),
}).strict().merge(baseSchema).describe('Focuses window by id. Windows Ids can be fetches with findProcessesWindows');

const typeTextRemoteCommandSchema = z.object({
  typeText: z.union([z.string(), variableValueSchema]).describe('Any string to type'),
}).strict().merge(baseSchema).describe('Types text on the remote PC.');

const findPidsByNameRemoteCommandSchema = z.object({
  findPidsByName: z.string().describe('Name of the executalbe to search for process IDs'),
  assignIds: z.string().optional().describe('Assigns Ids of PIDs to a variable'),
}).strict().merge(baseSchema).describe('Finds all processes with specified name');

const findProcessWindowsRemoteCommandSchema = z.object({
  findProcessWindows: z.number().describe('Process ID to get windows IDs from'),
  assignIds: z.string().optional().describe('Assigns Ids of found windows to a variable'),
}).strict().merge(baseSchema).describe('Finds all windows of the process');

const pickAssignmentPolicy = z.enum(['first', 'last', 'all'])
    .describe('If multiple ids are returned assign policy. If not specified first would be used');

const findProcessesWindowsRemoteCommandSchema = z.object({
  findProcessesWindows: z.union([z.array(z.number()), variableValueSchema])
      .describe('Processes IDs to get windows IDs from. Should be array length matching variable names'),
  assignIds: z.array(z.string()).optional().describe('Assigns Ids of found windows to a variable'),
  pick: pickAssignmentPolicy.optional(),
}).strict().merge(baseSchema).describe('Finds all windows of the process');

const mouseMoveClickRemoteCommandSchema = z.object({
  mouseMoveX: z.union([z.number(), variableValueSchema]).describe('X coordinate'),
  mouseMoveY: z.union([z.number(), variableValueSchema]).describe('Y coordinate'),
}).strict().merge(baseSchema).describe('Moves mouse to specified coordinates and clicks with left button');

const leftMouseClickRemoteCommandSchema = z.object({
  leftMouseClick: z.boolean(),
}).strict().merge(baseSchema).describe('Clicks mouse on current position');

const killExeByNameRemoteCommandSchema = z.object({
  killByName: z.union([z.string(), variableValueSchema]).describe('Executable file name. E.g. Chrome.exe'),
}).strict().merge(baseSchema).describe('Kills a process on the remote PC.');

const killExeByPidRemoteCommandSchema = z.object({
  killByPid: z.union([z.number(), variableValueSchema]).describe('Executalbe process ID. E.g. 1234'),
}).strict().merge(baseSchema).describe('Kills a process on the remote PC.');

const remoteCommandSchema = z.union([
  keyPressRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
  findPidsByNameRemoteCommandSchema,
  findProcessWindowsRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
]).describe('A remote command');


type TypeTextRemoteCommand = z.infer<typeof typeTextRemoteCommandSchema>
type FocusProcessWindowRemoteCommand = z.infer<typeof focusProcessWindowRemoteCommandSchema>
type FocusWindowRemoteCommand = z.infer<typeof focusWindowRemoteCommandSchema>
type KeyPressRemoteCommand = z.infer<typeof keyPressRemoteCommandSchema>
type BaseRemoteCommand = z.infer<typeof baseSchema>
type MouseMoveClickRemoteCommand = z.infer<typeof mouseMoveClickRemoteCommandSchema>
type LeftMouseClickRemoteCommand = z.infer<typeof leftMouseClickRemoteCommandSchema>
type ExecuteRemoteCommand = z.infer<typeof launchExeRemoteCommandSchema>
type RemoteCommand = z.infer<typeof remoteCommandSchema>
type Key = z.infer<typeof keySchema>;


type KillExeByPidRemoteCommand = z.infer<typeof killExeByPidRemoteCommandSchema>
type KillExeByNameRemoteCommand = z.infer<typeof killExeByNameRemoteCommandSchema>

type FindPidsByNameRemoteCommand = z.infer<typeof findPidsByNameRemoteCommandSchema>
type FindProcessWindowsRemoteCommand = z.infer<typeof findProcessWindowsRemoteCommandSchema>
type FindProcessesWindowsRemoteCommand = z.infer<typeof findProcessesWindowsRemoteCommandSchema>

export type {
  TypeTextRemoteCommand,
  KeyPressRemoteCommand,
  BaseRemoteCommand,
  MouseMoveClickRemoteCommand,
  LeftMouseClickRemoteCommand,
  FocusProcessWindowRemoteCommand,
  FocusWindowRemoteCommand,
  ExecuteRemoteCommand,
  RemoteCommand,
  Key,
  KillExeByPidRemoteCommand,
  KillExeByNameRemoteCommand,
  FindPidsByNameRemoteCommand,
  FindProcessWindowsRemoteCommand,
  FindProcessesWindowsRemoteCommand,
};

export {
  keySchema,
  variableValueSchema,
  delayCommandsSchema,
  keyPressRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  remoteCommandSchema,
  findPidsByNameRemoteCommandSchema,
  findProcessWindowsRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
};

