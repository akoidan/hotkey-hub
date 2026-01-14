/* eslint-disable max-lines*/
import {z, ZodIssueCode} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import type {ConfigDataWoMacro} from '@/config/types/schema';
import {type VariableValue, variableValueSchema} from '@/config/types/variables';

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

const baseDestinationSchema = z.object({
  destination: z.union([variableValueSchema, z.string()]).superRefine((destination, ctx) => {
    const data: ConfigDataWoMacro = schemaRootCache.data ?? {ips: {}};
    const ipsKeys = new Set(Object.keys(data.ips ?? {}));

    if (!(destination as VariableValue).$ref && !data.ips[destination as string] ) {
      const allOptions = JSON.stringify(Array.from(ipsKeys));
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['destination'],
        message: `"${JSON.stringify(destination)}" is not a valid destination, possible options are ${allOptions}`,
      });
    }
  }).describe('Remote PC from ips or aliases section to send this command to'),
}).strict();

const baseRemoteCommandSchema = baseDestinationSchema.merge(delayCommandsSchema).extend({
  performOnRemote: z.string(),
}).strict();

const windowPropertiesSchema = z.object({
  x: z.union([variableValueSchema, z.number()]).describe('x position'),
  y: z.union([variableValueSchema, z.number()]).describe('y position'),
  width: z.union([variableValueSchema, z.number()]).describe('width'),
  height: z.union([variableValueSchema, z.number()]).describe('height'),
}).strict().describe('Definition of window location and size');

const setWindowBoundsRemoteSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('setWindowBounds'),
  variables: z.object({
    wid: z.union([variableValueSchema, z.number()]).describe('Window id'),
    bounds: z.union([windowPropertiesSchema, variableValueSchema]),
  }).strict(),
}).strict().describe('Sets window width height and x y position' );

const keyPressRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('keyPress'),
  variables: z.object({
    key: z.union([keySchema, z.array(keySchema), variableValueSchema])
      .describe('Key(s) to press. Can be a single key or array of keys for multiple presses.'),
    duration: z.union([
      variableValueSchema,
      z.number().min(50),
    ]).optional()
      .describe('How long to hold the key down in milliseconds. Minimum 50ms to ensure reliable key registration.'),
    durationDeviation: z.union([
      variableValueSchema,
      z.number().min(0).default(0),
    ]).optional()
      .describe('Adds randomness to key press duration. Value is the maximum +/- deviation in milliseconds. ' +
        'Useful for simulating human-like input patterns.'),
    holdKeys: z.union([keySchema, z.array(keySchema), variableValueSchema])
      .optional()
      .describe('Modifier keys to hold (e.g., Alt for Alt+1, Ctrl+Shift for Ctrl+Shift+A). Can be a key or key array.'),
  }).strict(),
}).strict().describe('Simulates keyboard input on the remote PC by sending key press events. ' +
  'Supports single keys, key combinations, and modifier keys with customizable timing and randomness. ' +
  'Use this for automating keyboard input or triggering keyboard shortcuts.');

const launchExeRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('launchExe'),
  assignVariable: z.string().optional().describe('If provided, would assign launched process id to this variable'),
  variables: z.object({
    path: z.union([variableValueSchema, z.string()])
      .describe('Full absolute path to the executable file to run on the remote PC.'),
    arguments: z.union([variableValueSchema, z.array(z.string())]).default([]).optional()
      .describe('Command-line arguments to pass to the executable. Each array element is a separate argument.'),
    waitTillFinish: z.union([variableValueSchema, z.boolean()]).default(false).optional()
      .describe('If true, waits for the launched program to complete before executing the next command. ' +
        'If false (default), continues with next command immediately after launch.'),
  }).strict(),
}).strict().describe('Starts a program on a remote PC.');

const focusProcessWindowRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('focusProcessWindow'),
  variables: z.object({
    pid: z.union([variableValueSchema, z.number()])
      .describe('Process ID (PID) of the window to focus. Can be obtained from findPidsByName command or launch command with assignId.'),
  }).strict(),
}).strict().describe('Brings a window to front and gives it focus by process ID. Useful for window automation and ensuring windows are active.');

const focusWindowRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('focusWindow'),
  variables: z.object({
    wid: z.union([variableValueSchema, z.number()])
      .describe('Window ID to focus. Can be obtained from findProcessWindows or findProcessesWindows commands.'),
  }).strict(),
}).strict().describe('Brings a window to the foreground and gives it focus based on its window ID.' +
  ' Window IDs can be retrieved using findProcessWindows or findProcessesWindows commands.');

const typeTextRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('typeText'),
  variables: z.object({
    text: z.union([variableValueSchema, z.string()])
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
      .describe('Deviation for randomness of delay. E.g if keyDelay = 100 and deviation = 0.2. Then value would be 80-120ms'),
  }).strict(),
}).strict().describe('Types text on the remote PC.');


const mouseMoveClickRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('mouseMoveClick'),
  variables: z.object({
    x: z.union([variableValueSchema, z.number()])
      .describe('X coordinate for mouse cursor.'),
    y: z.union([variableValueSchema, z.number()])
      .describe('Y coordinate for mouse cursor.'),
    pixelsPerIteration: z.union([variableValueSchema, z.number()]).optional().default(20)
      .describe('X coordinate for mouse cursor.'),
  }).strict(),
}).strict().describe('Moves mouse cursor to specified screen coordinates and performs a left-click.' +
  ' Combines movement and clicking into one action.');

const leftMouseClickRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('leftMouseClick'),
  variables: z.object({
    leftMouseClick: z.union([variableValueSchema, z.boolean()])
      .describe('Set to true to perform a left mouse click. ' +
        'The click will occur at the current cursor position without moving the mouse.'),
  }).strict(),
}).strict().describe('Performs a left mouse click at the current cursor position without moving the mouse. Use when cursor is already positioned.');

const killExeByNameRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('killExeByName'),
  variables: z.object({
    name: z.union([variableValueSchema, z.string()])
      .describe('Name of the executable file to terminate. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
  }).strict(),
}).strict().describe('Terminates all processes with the specified executable name. Use with caution - kills all instances of the program.');

const killExeByPidRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('killExeByPid'),
  variables: z.object({
    pid: z.union([variableValueSchema, z.number()])
      .describe('Process ID (PID) of the process to terminate. Example: 1234. Must be a valid running process ID.'),
  }).strict(),
}).strict().describe('Terminates a specific process by its PID on the remote PC.' +
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
]).describe('One of the commands that would be sent to a remote machine specified in destination property');


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
  baseDestinationSchema,
  mouseMoveClickRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  remoteCommandSchema,
  windowPropertiesSchema,
  focusWindowRemoteCommandSchema,
};

