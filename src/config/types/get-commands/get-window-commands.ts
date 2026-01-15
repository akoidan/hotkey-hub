import {z} from 'zod';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands-shared';

console.log('get-window-commands.ts: baseGetInfoCommandSchema', !!baseGetInfoCommandSchema);
// Reusable schemas
const windowIdVariablesSchema = z.object({
  wid: z.number().int().positive('Window ID must be a positive integer'),
}).strict();

const getWindowBoundsSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowBounds'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window bounds');

const getWindowTitleSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowTitle'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window title');

const getWindowOpacitySchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowOpacity'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window opacity (0..1)');

const getWindowOwnerSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowOwner'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get window owner handle');

const getActiveWindowIdSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getActiveWindowId'),
}).strict().describe('Get active window id (raw handle)');

const getActiveWindowSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getActiveWindow'),
}).strict().describe('Get information about current active window');


const isWindowSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('isWindow'),
  variables: windowIdVariablesSchema,
}).strict().describe('Check if handle is a window');

const isWindowVisibleSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('isWindowVisible'),
  variables: windowIdVariablesSchema,
}).strict().describe('Check if window is visible');

const getWindowsIdByPidSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowsIdByPid'),
  variables: z.object({
    id: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict().describe('Get all windows with their IDs for a concrete process id');


// Type definitions
type WindowIdVariables = z.infer<typeof windowIdVariablesSchema>;
type GetWindowsIdByPidCommand = z.infer<typeof getWindowsIdByPidSchema>;
type GetActiveWindowIdCommand = z.infer<typeof getActiveWindowIdSchema>;
type GetActiveWindowCommand = z.infer<typeof getActiveWindowSchema>;
type GetWindowBoundsCommand = z.infer<typeof getWindowBoundsSchema>;
type GetWindowTitleCommand = z.infer<typeof getWindowTitleSchema>;
type GetWindowOpacityCommand = z.infer<typeof getWindowOpacitySchema>;
type GetWindowOwnerCommand = z.infer<typeof getWindowOwnerSchema>;
type IsWindowCommand = z.infer<typeof isWindowSchema>;
type IsWindowVisibleCommand = z.infer<typeof isWindowVisibleSchema>;


const getWindowAllSchema = z.union([
  getWindowsIdByPidSchema,
  getActiveWindowIdSchema,
  getActiveWindowSchema,
  getWindowBoundsSchema,
  getWindowTitleSchema,
  getWindowOpacitySchema,
  getWindowOwnerSchema,
  isWindowSchema,
  isWindowVisibleSchema,
]).describe('Allows to get information about windows, transform and move them');


// Export all schemas
export {
  getWindowAllSchema,
  windowIdVariablesSchema,
  getWindowsIdByPidSchema,
  getActiveWindowIdSchema,
  getActiveWindowSchema,
  getWindowBoundsSchema,
  getWindowTitleSchema,
  getWindowOpacitySchema,
  getWindowOwnerSchema,
  isWindowSchema,
  isWindowVisibleSchema,
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
  IsWindowCommand,
  IsWindowVisibleCommand,
};
