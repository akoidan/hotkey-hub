import {z} from 'zod';
import {makeVariableUnion} from '@/config/types/variables';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';

export const windowPropertiesSchema = z.object({
  x: z.number().describe('x position'),
  y: z.number().describe('y position'),
  width: z.number().describe('width'),
  height: z.number().describe('height'),
}).strict().describe('Definition of window location and size');

const windowPropertiesVariableSchema = makeVariableUnion(windowPropertiesSchema);

const setWindowBoundsRemoteVariableSchema = z.object({
  wid: z.number().describe('Window id'),
  bounds: windowPropertiesVariableSchema,
}).strict();

const setWindowBoundsRemoteCommandVariableSchema = makeVariableUnion(setWindowBoundsRemoteVariableSchema);

const setWindowBoundsRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('setWindowBounds'),
  variables: setWindowBoundsRemoteCommandVariableSchema,
}).strict().describe('Sets window width height and x y position');

const focusProcessWindowRemoteVariableSchema = z.object({
  pid: z.number()
    .describe('Process ID (PID) of the window to focus. Can be obtained from findPidsByName command or launch command with assignId.'),
}).strict();

const focusProcessWindowRemoteCommandVariableSchema = makeVariableUnion(focusProcessWindowRemoteVariableSchema);

const focusProcessWindowRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('focusProcessWindow'),
  variables: focusProcessWindowRemoteCommandVariableSchema,
}).strict()
  .describe('Brings a window to front and gives it focus by process ID. Useful for window automation and ensuring windows are active.');

const focusWindowRemoteVariableSchema = z.object({
  wid: z.number()
    .describe('Window ID to focus. Can be obtained from findProcessWindows or findProcessesWindows commands.'),
}).strict();

const focusWindowRemoteCommandVariableSchema = makeVariableUnion(focusWindowRemoteVariableSchema);

const focusWindowRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('focusWindow'),
  variables: focusWindowRemoteCommandVariableSchema,
}).strict().describe('Brings a window to the foreground and gives it focus based on its window ID. ' +
  'Window IDs can be retrieved using findProcessWindows or findProcessesWindows commands.');

const windowCommandsSchema = z.union([
  setWindowBoundsRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
]).describe('Window-related remote commands');

type WindowProperties = z.infer<typeof windowPropertiesSchema>;
type SetWindowBoundsRemoteVariable = z.infer<typeof setWindowBoundsRemoteVariableSchema>;
type FocusProcessWindowRemoteVariable = z.infer<typeof focusProcessWindowRemoteVariableSchema>;
type FocusWindowRemoteVariable = z.infer<typeof focusWindowRemoteVariableSchema>;
type FocusProcessWindowRemoteCommand = z.infer<typeof focusProcessWindowRemoteCommandSchema>;
type FocusWindowRemoteCommand = z.infer<typeof focusWindowRemoteCommandSchema>;
type SetWindowBoundsRemoteCommand = z.infer<typeof setWindowBoundsRemoteCommandSchema>;

export type {
  WindowProperties,
  SetWindowBoundsRemoteVariable,
  FocusProcessWindowRemoteVariable,
  FocusWindowRemoteVariable,
  FocusProcessWindowRemoteCommand,
  FocusWindowRemoteCommand,
  SetWindowBoundsRemoteCommand,
};

export {
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  setWindowBoundsRemoteCommandSchema,
  windowCommandsSchema,
  setWindowBoundsRemoteCommandVariableSchema,
  focusProcessWindowRemoteCommandVariableSchema,
  focusWindowRemoteCommandVariableSchema,
  setWindowBoundsRemoteVariableSchema,
  focusProcessWindowRemoteVariableSchema,
  focusWindowRemoteVariableSchema,
};