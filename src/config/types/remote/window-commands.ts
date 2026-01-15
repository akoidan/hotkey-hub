import {z} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';

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


const focusProcessWindowRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('focusProcessWindow'),
  variables: z.object({
    pid: z.union([variableValueSchema, z.number()])
      .describe('Process ID (PID) of the window to focus. Can be obtained from findPidsByName command or launch command with assignId.'),
  }).strict(),
})
  .strict()
  .describe('Brings a window to front and gives it focus by process ID. Useful for window automation and ensuring windows are active.');

const focusWindowRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('focusWindow'),
  variables: z.object({
    wid: z.union([variableValueSchema, z.number()])
      .describe('Window ID to focus. Can be obtained from findProcessWindows or findProcessesWindows commands.'),
  }).strict(),
}).strict().describe('Brings a window to the foreground and gives it focus based on its window ID.' +
  ' Window IDs can be retrieved using findProcessWindows or findProcessesWindows commands.');


const windowAllSchemas = z.union([
  setWindowBoundsRemoteSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
]).describe('Window-related remote commands');

type FocusProcessWindowRemoteCommand = z.infer<typeof focusProcessWindowRemoteCommandSchema>
type FocusWindowRemoteCommand = z.infer<typeof focusWindowRemoteCommandSchema>
type SetWindowBoundsRemoteCommand = z.infer<typeof setWindowBoundsRemoteSchema>

export type {
  SetWindowBoundsRemoteCommand,
  FocusProcessWindowRemoteCommand,
  FocusWindowRemoteCommand,
};

export {
  setWindowBoundsRemoteSchema,
  focusProcessWindowRemoteCommandSchema,
  windowPropertiesSchema,
  focusWindowRemoteCommandSchema,
  windowAllSchemas,
};