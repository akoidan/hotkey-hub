/* eslint-disable max-lines*/
import {z, ZodIssueCode} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import type {ConfigDataWoMacro} from '@/config/types/schema';
import type {VariableValue} from '@/config/types/variables';
import {variableValueSchema} from '@/config/types/variables';

// import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';
// const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()] as string[];
// eslint-disable-next-line  max-len
const keySchema = z.enum(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space', 'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd', 'menu', 'fn', 'shift', 'command', 'right_shift', 'command', '`', '-', '=', 'backspace', '[', ']', '\\', ';', '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end', 'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'enter', 'caps_lock', 'scroll_lock', 'num_lock', 'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random']).describe('One of the keyboard keys.');

const delayCommandsSchema = z.object({
  delayAfter: z.union([variableValueSchema, z.number()]).optional()
    .describe('Delay (ms) after command completes, before next command. Ensures command has time to take effect.'),
  delayBefore: z.union([variableValueSchema, z.number()]).optional()
    .describe('Delay (ms) before executing command. Helps create precisely timed sequences.'),
}).strict();

const baseSchema = z.object({
  destination: z.union([variableValueSchema, z.string()]).superRefine((destination, ctx) => {
    const data: ConfigDataWoMacro = schemaRootCache.data ?? {ips: {}};
    const ipsKeys = new Set(Object.keys(data.ips ?? {}));

    if (!(destination as VariableValue).$ref && !data.ips[destination as string] ) {
      const allOptions = JSON.stringify(Array.from(ipsKeys));
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['destination'],
        message: `"${destination}" is not a valid destination, possible options are ${allOptions}`,
      });
    }
  }).describe('Remote PC from ips or aliases section to send this command to'),
}).strict().merge(delayCommandsSchema);

const windowPropertiesSchema = z.object({
  x: z.union([variableValueSchema, z.number()]).describe('x position'),
  y: z.union([variableValueSchema, z.number()]).describe('y position'),
  width: z.union([variableValueSchema, z.number()]).describe('width'),
  height: z.union([variableValueSchema, z.number()]).describe('height'),
}).strict().describe('Definition of window location and size');

const setWindowBoundsRemoteSchema = z.object({
  setWindowIdBound: z.union([variableValueSchema, z.number()]).describe('Window id'),
  windowProperties: z.union([windowPropertiesSchema, variableValueSchema]),
}).strict().merge(baseSchema).describe('Sets window width height and x y position' );

const keyPressRemoteCommandSchema = z.object({
  keyPress: z.union([keySchema, z.array(keySchema), variableValueSchema])
    .describe('Key(s) to press. Can be a single key or array of keys for multiple presses.'),
  duration: z.union([
    variableValueSchema,
    z.number().min(50),
  ]).optional()
    .describe('How long to hold the key down in milliseconds. Minimum 50ms to ensure reliable key registration.'),
  durationDeviation: z.union([
    variableValueSchema,
    z.number().min(0).default(0)
  ]).optional()
    .describe('Adds randomness to key press duration. Value is the maximum +/- deviation in milliseconds. ' +
      'Useful for simulating human-like input patterns.'),
  holdKeys: z.union([keySchema, z.array(keySchema), variableValueSchema])
    .optional()
    .describe('Modifier keys to hold (e.g., Alt for Alt+1, Ctrl+Shift for Ctrl+Shift+A). Can be a key or key array.'),
}).strict().merge(baseSchema).describe('Simulates keyboard input on the remote PC by sending key press events. ' +
  'Supports single keys, key combinations, and modifier keys with customizable timing and randomness. ' +
  'Use this for automating keyboard input or triggering keyboard shortcuts.');

const launchExeRemoteCommandSchema = z.object({
  launch: z.union([variableValueSchema, z.string()])
    .describe('Full absolute path to the executable file to run on the remote PC.'),
  arguments: z.union([variableValueSchema, z.array(z.string())]).optional()
    .describe('Command-line arguments to pass to the executable. Each array element is a separate argument.'),
  waitTillFinish: z.union([variableValueSchema, z.boolean()]).optional()
    .describe('If true, waits for the launched program to complete before executing the next command. ' +
      'If false (default), continues with next command immediately after launch.'),
  assignId: z.union([variableValueSchema, z.string()]).optional()
    .describe('Variable name to store the Process ID (PID) of the launched program. ' +
      'The stored PID can be used in subsequent commands for window management or process control.')
}).strict().merge(baseSchema).describe('Starts a program on a remote PC.');

const focusProcessWindowRemoteCommandSchema = z.object({
  focusPid: z.union([variableValueSchema, z.number()])
    .describe('Process ID (PID) of the window to focus. Can be obtained from findPidsByName command or launch command with assignId.')
})
  .strict()
  .merge(baseSchema)
  .describe('Brings a window to front and gives it focus by process ID. Useful for window automation and ensuring windows are active.');

const focusWindowRemoteCommandSchema = z.object({
  focusWid: z.union([variableValueSchema, z.number()])
    .describe('Window ID to focus. Can be obtained from findProcessWindows or findProcessesWindows commands.')
})
  .strict()
  .merge(baseSchema)
  .describe('Brings a window to the foreground and gives it focus based on its window ID.' +
    ' Window IDs can be retrieved using findProcessWindows or findProcessesWindows commands.');

const typeTextRemoteCommandSchema = z.object({
  typeText: z.union([variableValueSchema, z.string()])
    .describe('Any string to type'),
  keyDelay: z.union([variableValueSchema, z.number()])
    .default(0)
    .optional()
    .describe('Delay between keystroke in milliseconds. By default types as fast as possible, around 40ms per char'),
  keyDelayDeviation: z.union([
    variableValueSchema,
    z.number().positive(),
  ])
    .default(0)
    .optional()
    .describe('Deviation for randomness of delay. E.g if keyDelay = 100 and deviation = 0.2. Then value would be 80-120ms')
})
  .strict()
  .merge(baseSchema)
  .describe('Types text on the remote PC.');

const findPidsByNameRemoteCommandSchema = z.object({
  findPidsByName: z.union([variableValueSchema, z.string()])
    .describe('Name of the executable file to search for. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
  assignIds: z.union([variableValueSchema, z.string()])
    .optional()
    .describe('Assign list of pids to a variable.' +
      ' Note variable type would be an array in this case. Use expression to pick any of the results')
})
  .strict()
  .merge(baseSchema)
  .describe('Gets PIDs for all processes with given executable name. Use assignIds to store PIDs as variables for later use.');

const findProcessWindowsRemoteCommandSchema = z.object({
  findProcessWindows: z.union([variableValueSchema, z.number()])
    .describe('Process ID to find window IDs for. Process must be running with visible windows.'),
  assignIds: z.union([variableValueSchema, z.string()])
    .optional()
    .describe('Variable name to store list of windows ids')
})
  .strict()
  .merge(baseSchema)
  .describe('Finds all visible windows belonging to a specific process.' +
    ' Useful for window management automation when a process has multiple windows.');


const findProcessesWindowsRemoteCommandSchema = z.object({
  findProcessesWindows: z.union([variableValueSchema, z.array(z.number())])
      .describe('Array of Process IDs (PIDs) to find window IDs for.' +
        ' The length of this array should match the length of assignIds if specified.'),
  assignIds: z.union([variableValueSchema, z.array(z.string())])
    .optional()
    .describe('List of variable names to store the found windows IDs.' +
      ' Each process\'s window IDs array will be assigned to the corresponding variable.')
})
  .strict()
  .merge(baseSchema)
  .describe('Finds all visible windows belonging to multiple processes.' +
    ' Similar to findProcessWindows but works with multiple processes at once for efficiency.');

const mouseMoveClickRemoteCommandSchema = z.object({
  mouseMoveX: z.union([variableValueSchema, z.number()])
    .describe('X coordinate for mouse cursor.'),
  mouseMoveY: z.union([variableValueSchema, z.number()])
    .describe('Y coordinate for mouse cursor.')
})
  .strict()
  .merge(baseSchema)
  .describe('Moves mouse cursor to specified screen coordinates and performs a left-click.' +
    ' Combines movement and clicking into one action.');

const leftMouseClickRemoteCommandSchema = z.object({
  leftMouseClick: z.union([variableValueSchema, z.boolean()])
    .describe('Set to true to perform a left mouse click. ' +
    'The click will occur at the current cursor position without moving the mouse.')
})
  .strict()
  .merge(baseSchema)
  .describe('Performs a left mouse click at the current cursor position without moving the mouse. Use when cursor is already positioned.');

const killExeByNameRemoteCommandSchema = z.object({
  killByName: z.union([variableValueSchema, z.string()])
    .describe('Name of the executable file to terminate. Example: "Chrome.exe". Case-sensitive on some operating systems.')
})
  .strict()
  .merge(baseSchema)
  .describe('Terminates all processes with the specified executable name. Use with caution - kills all instances of the program.');

const killExeByPidRemoteCommandSchema = z.object({
  killByPid: z.union([variableValueSchema, z.number()])
    .describe('Process ID (PID) of the process to terminate. Example: 1234. Must be a valid running process ID.')
})
  .strict()
  .merge(baseSchema)
  .describe('Terminates a specific process by its PID on the remote PC.' +
    ' More precise than killByName as it targets a single specific process.');

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
  findPidsByNameRemoteCommandSchema,
  findProcessWindowsRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
]).describe('One of the commands that would be sent to a remote machine specified in destination property');


type TypeTextRemoteCommand = z.infer<typeof typeTextRemoteCommandSchema>
type FocusProcessWindowRemoteCommand = z.infer<typeof focusProcessWindowRemoteCommandSchema>
type FocusWindowRemoteCommand = z.infer<typeof focusWindowRemoteCommandSchema>
type KeyPressRemoteCommand = z.infer<typeof keyPressRemoteCommandSchema>
type SetWindowBoundsRemoteCommand = z.infer<typeof setWindowBoundsRemoteSchema>
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
  SetWindowBoundsRemoteCommand,
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
  setWindowBoundsRemoteSchema,
  launchExeRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  remoteCommandSchema,
  findPidsByNameRemoteCommandSchema,
  windowPropertiesSchema,
  findProcessWindowsRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
};

