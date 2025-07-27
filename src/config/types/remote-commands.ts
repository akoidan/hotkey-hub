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
const keySchema = z.enum(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space', 'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd', 'menu', 'fn', 'shift', 'command', 'right_shift', 'command', '`', '-', '=', 'backspace', '[', ']', '\\', ';', '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end', 'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'enter', 'caps_lock', 'scroll_lock', 'num_lock', 'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random']).describe('One of the keyboard keys.');

const delayCommandsSchema = z.object({
  delayAfter: z.union([z.number(), variableValueSchema]).optional()
    .describe('Delay in milliseconds to wait after this command completes before executing the next command. ' +
      'Useful when the command needs time to take effect.'),
  delayBefore: z.union([z.number(), variableValueSchema]).optional()
    .describe('Delay in milliseconds to wait before executing this command. ' +
      'Useful for creating sequences with precise timing.')
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
  keyPress: z.union([keySchema, variableValueSchema, z.array(keySchema)])
    .describe('Specifies the key(s) to be pressed. Can be a single key, a variable containing a key, or an array of keys for multiple keypresses.'),
  duration: z.number().min(50).optional()
    .describe('How long to hold the key down in milliseconds. Minimum 50ms to ensure reliable key registration.'),
  durationDiviation: z.number().default(0).optional()
    .describe('Adds randomness to key press duration. Value is the maximum +/- deviation in milliseconds. ' +
      'Useful for simulating human-like input patterns.'),
  holdKeys: z.union([keySchema, variableValueSchema, z.array(keySchema)])
    .optional()
    .describe('Modifier keys to hold while pressing the main key(s). Examples: Alt for Alt+1, Ctrl+Shift for Ctrl+Shift+A. ' +
      'Can be a single key, a variable, or an array of keys.'),
}).strict().merge(baseSchema).describe('Simulates keyboard input on the remote PC by sending key press events. ' +
  'Supports single keys, key combinations, and modifier keys with customizable timing and randomness. ' +
  'Use this for automating keyboard input or triggering keyboard shortcuts.');

const launchExeRemoteCommandSchema = z.object({
  launch: z.string().describe('Full absolute path to the executable file to run on the remote PC.'),
  arguments: z.array(z.string()).optional()
    .describe('Command-line arguments to pass to the executable. Each array element is a separate argument.'),
  waitTillFinish: z.boolean().optional()
    .describe('If true, waits for the launched program to complete before executing the next command. ' +
      'If false (default), continues with next command immediately after launch.'),
  assignId: z.string().optional()
    .describe('Variable name to store the Process ID (PID) of the launched program. ' +
      'The stored PID can be used in subsequent commands for window management or process control.'),
}).strict().merge(baseSchema).describe('Starts a program on a remote PC.');

const focusProcessWindowRemoteCommandSchema = z.object({
  focusPid: z.union([variableValueSchema, z.number()]).describe('Process ID (PID) of the window to focus. Can be obtained from findPidsByName command or launch command with assignId.'),
}).strict().merge(baseSchema).describe('Brings a window to the foreground and gives it focus based on its process ID. Useful for automating window management or ensuring specific windows are active before sending input.');

const focusWindowRemoteCommandSchema = z.object({
  focusWid: z.union([variableValueSchema, z.number()]).describe('Window ID to focus. Can be obtained from findProcessWindows or findProcessesWindows commands.'),
}).strict().merge(baseSchema).describe('Brings a window to the foreground and gives it focus based on its window ID. Window IDs can be retrieved using findProcessWindows or findProcessesWindows commands.');

const typeTextRemoteCommandSchema = z.object({
  typeText: z.union([z.string(), variableValueSchema]).describe('Any string to type'),
}).strict().merge(baseSchema).describe('Types text on the remote PC.');

const findPidsByNameRemoteCommandSchema = z.object({
  findPidsByName: z.union([z.string(), variableValueSchema]).describe('Name of the executable file to search for. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
  assignIds: z.array(z.string()).optional().describe('List of variable names to store the found process IDs. The variables can be used in subsequent commands that accept PIDs.'),
  pick: z.enum(['first', 'last', 'all'])
    .optional()
    .describe('If multiple ids are returned assign policy. If not specified first would be used'),
}).strict().merge(baseSchema).describe('Searches for all processes with the specified executable name and retrieves their PIDs. Use assignIds to store the PIDs in variables for later use in other commands.');

const findProcessWindowsRemoteCommandSchema = z.object({
  findProcessWindows: z.union([z.number(), variableValueSchema]).describe('Process ID (PID) to find window IDs for. The process must be running and have visible windows.'),
  assignIds: z.array(z.string()).optional().describe('List of variable names to store the found window IDs. These variables can be used in subsequent window management commands.'),
  pick: z.enum(['first', 'last', 'all'])
    .optional()
    .describe('If multiple ids are returned assign policy. If not specified first would be used'),
}).strict().merge(baseSchema).describe('Finds all visible windows belonging to a specific process. Useful for window management automation when a process has multiple windows.');

const pickAssignmentPolicy = z.enum(['first', 'last', 'all'])
  .describe('Policy for assigning multiple results to variables:\n' +
    '- first: Use only the first result\n' +
    '- last: Use only the last result\n' +
    '- all: Use all results (must have enough variables defined in assignIds)\n' +
    'Defaults to "first" if not specified.');

const findProcessesWindowsRemoteCommandSchema = z.object({
  findProcessesWindows: z.union([z.array(z.number()), variableValueSchema])
      .describe('Array of Process IDs (PIDs) to find window IDs for. The length of this array should match the length of assignIds if specified.'),
  assignIds: z.array(z.string()).optional().describe('List of variable names to store the found window IDs. Each process\'s window IDs will be assigned to the corresponding variable.'),
  pick: pickAssignmentPolicy.optional(),
}).strict().merge(baseSchema).describe('Finds all visible windows belonging to multiple processes. Similar to findProcessWindows but works with multiple processes at once for efficiency.');

const mouseMoveClickRemoteCommandSchema = z.object({
  mouseMoveX: z.union([z.number(), variableValueSchema]).describe('X coordinate'),
  mouseMoveY: z.union([z.number(), variableValueSchema]).describe('Y coordinate'),
}).strict().merge(baseSchema).describe('Moves mouse to specified coordinates and clicks with left button');

const leftMouseClickRemoteCommandSchema = z.object({
  leftMouseClick: z.boolean(),
}).strict().merge(baseSchema).describe('Clicks mouse on current position');

const killExeByNameRemoteCommandSchema = z.object({
  killByName: z.union([z.string(), variableValueSchema]).describe('Name of the executable file to terminate. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
}).strict().merge(baseSchema).describe('Terminates all processes with the specified executable name on the remote PC. Use with caution as it will kill all instances of the specified program.');

const killExeByPidRemoteCommandSchema = z.object({
  killByPid: z.union([z.number(), variableValueSchema]).describe('Process ID (PID) of the process to terminate. Example: 1234. Must be a valid running process ID.'),
}).strict().merge(baseSchema).describe('Terminates a specific process by its PID on the remote PC. More precise than killByName as it targets a single specific process.');

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
]).describe('One of the commands that would be sent to a remote machine specified in destination property');


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
type Delay = z.infer<typeof delayCommandsSchema>;

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
  Delay,
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

