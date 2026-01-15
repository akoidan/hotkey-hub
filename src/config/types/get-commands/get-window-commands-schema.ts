import {z} from 'zod';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands-shared';

// Reusable schemas
const windowIdVariablesSchema = z.object({
  wid: z.number().int().positive('Window ID must be a positive integer'),
}).strict();

const getWindowBoundsCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowBounds'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window bounds');

const getWindowTitleCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowTitle'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window title');

const getWindowOpacityCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowOpacity'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window opacity (0..1)');

const getWindowOwnerCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowOwner'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window owner handle');

const getActiveWindowIdCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getActiveWindowId'),
}).strict().describe('Get active window id (raw handle)');

const getActiveWindowCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getActiveWindow'),
}).strict().describe('Get information about current active window');


const getWindowValidityCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowValidity'),
  variables: windowIdVariablesSchema,
}).strict().describe('Check if handle is a window');

const getWindowVisibilityCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowVisibility'),
  variables: windowIdVariablesSchema,
}).strict().describe('Check if window is visible');

const getWindowsIdByPidCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowsIdByPid'),
  variables: z.object({
    id: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict().describe('Get all windows with their IDs for a concrete process id');


// Type definitions
type WindowIdVariables = z.infer<typeof windowIdVariablesSchema>;
type GetWindowsIdByPidCommand = z.infer<typeof getWindowsIdByPidCommandSchema>;
type GetActiveWindowIdCommand = z.infer<typeof getActiveWindowIdCommandSchema>;
type GetActiveWindowCommand = z.infer<typeof getActiveWindowCommandSchema>;
type GetWindowBoundsCommand = z.infer<typeof getWindowBoundsCommandSchema>;
type GetWindowTitleCommand = z.infer<typeof getWindowTitleCommandSchema>;
type GetWindowOpacityCommand = z.infer<typeof getWindowOpacityCommandSchema>;
type GetWindowOwnerCommand = z.infer<typeof getWindowOwnerCommandSchema>;
type GetWindowValidityCommand = z.infer<typeof getWindowValidityCommandSchema>;
type GetWindowVisibilityCommand = z.infer<typeof getWindowVisibilityCommandSchema>;


const getWindowCommandsSchema = z.union([
  getWindowsIdByPidCommandSchema,
  getActiveWindowIdCommandSchema,
  getActiveWindowCommandSchema,
  getWindowBoundsCommandSchema,
  getWindowTitleCommandSchema,
  getWindowOpacityCommandSchema,
  getWindowOwnerCommandSchema,
  getWindowValidityCommandSchema,
  getWindowVisibilityCommandSchema,
]).describe('Allows to get information about windows, transform and move them');


// Export all schemas
export {
  getWindowCommandsSchema,
  windowIdVariablesSchema,
  getWindowsIdByPidCommandSchema,
  getActiveWindowIdCommandSchema,
  getActiveWindowCommandSchema,
  getWindowBoundsCommandSchema,
  getWindowTitleCommandSchema,
  getWindowOpacityCommandSchema,
  getWindowOwnerCommandSchema,
  getWindowValidityCommandSchema,
  getWindowVisibilityCommandSchema,
};


// Export all types
export type {
  WindowIdVariables,
  GetWindowsIdByPidCommand,
  GetActiveWindowIdCommand,
  GetActiveWindowCommand,
  GetWindowBoundsCommand,
  GetWindowTitleCommand,
  GetWindowOpacityCommand,
  GetWindowOwnerCommand,
  GetWindowValidityCommand,
  GetWindowVisibilityCommand,
};
