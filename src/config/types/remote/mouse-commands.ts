import {z} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';

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



type MouseMoveClickRemoteCommand = z.infer<typeof mouseMoveClickRemoteCommandSchema>
type LeftMouseClickRemoteCommand = z.infer<typeof leftMouseClickRemoteCommandSchema>


export type {

  MouseMoveClickRemoteCommand,
  LeftMouseClickRemoteCommand,

};

export {
  mouseMoveClickRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
};