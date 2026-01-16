import {z} from 'zod';
import {makeVariableUnion} from '@/config/types/variables';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';

const mouseMoveClickRemoteVariableSchema = z.object({
  x: z.number()
    .describe('X coordinate for mouse cursor.'),
  y: z.number()
    .describe('Y coordinate for mouse cursor.'),
  pixelsPerIteration: z.number().default(20).optional()
    .describe('Pixels to move per iteration for smooth movement.'),
}).strict();

const mouseMoveClickRemoteCommandVariableSchema = makeVariableUnion(mouseMoveClickRemoteVariableSchema);

const mouseMoveClickRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('mouseMoveLeftClick'),
  variables: mouseMoveClickRemoteCommandVariableSchema,
}).strict().describe('Moves mouse cursor to specified screen coordinates and performs a left-click. ' +
  'Combines movement and clicking into one action.');

const mouseMoveRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('mouseMove'),
  variables: mouseMoveClickRemoteCommandVariableSchema,
}).strict().describe('Moves mouse cursor to specified screen coordinates.');

const leftMouseClickRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('leftMouseClick'),
}).strict()
  .describe('Performs a left mouse click at the current cursor position without moving the mouse. Use when cursor is already positioned.');

const mouseCommandsSchema = z.union([
  mouseMoveClickRemoteCommandSchema,
  mouseMoveRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
]).describe('Mouse-related remote commands');

type MouseMoveClickRemoteVariable = z.infer<typeof mouseMoveClickRemoteVariableSchema>;
type MouseMoveClickRemoteCommand = z.infer<typeof mouseMoveClickRemoteCommandSchema>;
type LeftMouseClickRemoteCommand = z.infer<typeof leftMouseClickRemoteCommandSchema>;
type MouseMoveRemoteCommand = z.infer<typeof mouseMoveRemoteCommandSchema>;

export type {
  MouseMoveRemoteCommand,
  MouseMoveClickRemoteVariable,
  MouseMoveClickRemoteCommand,
  LeftMouseClickRemoteCommand,
};

export {
  mouseMoveRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  mouseCommandsSchema,
  mouseMoveClickRemoteCommandVariableSchema,
  mouseMoveClickRemoteVariableSchema,
};