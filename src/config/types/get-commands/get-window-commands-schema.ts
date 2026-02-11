import {z} from 'zod';
import {makeVariableUnion} from '@/config/types/variables';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands-shared';

// Reusable schemas
const windowIdVariablesSchema = z.object({
  wid: z.number().int().positive('Window ID must be a positive integer'),
}).strict();

const windowIdVariablesCommandSchema = makeVariableUnion(windowIdVariablesSchema);


const getActiveWindowCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getActiveWindow'),
}).strict().describe('Get information about current active window');


const getWindowCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindow'),
  variables: windowIdVariablesCommandSchema,
}).strict().describe('Get information about window with specified window id');

const getWindowsIdByPidVariablesSchema = z.object({
  pid: z.number().int().positive('Process ID must be a positive integer'),
}).strict();

const getWindowsIdByPidCommandVariablesSchema = makeVariableUnion(getWindowsIdByPidVariablesSchema);

const getWindowsIdByMultiplePidsVariablesSchema = z.object({
  pids: z.array(z.number().int().positive('Process ID must be a positive integer')),
}).strict();

const getWindowsIdByMultiplePidsCommandVariablesSchema = makeVariableUnion(getWindowsIdByMultiplePidsVariablesSchema);

const getWindowsIdByPidCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowsIdByPid'),
  variables: getWindowsIdByPidCommandVariablesSchema,
}).strict().describe('Get all windows with their IDs for a concrete process id');

const getWindowsIdByMutliplePidsCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowsIdByMultiplePids'),
  variables: getWindowsIdByMultiplePidsCommandVariablesSchema,
}).strict().describe('Get all windows with their IDs for a concrete process id');

// Type definitions
type WindowIdVariables = z.infer<typeof windowIdVariablesSchema>;
type GetWindowsIdByPidVariables = z.infer<typeof getWindowsIdByPidVariablesSchema>;
type GetWindowsIdByPidCommand = z.infer<typeof getWindowsIdByPidCommandSchema>;
type GetActiveWindowCommand = z.infer<typeof getActiveWindowCommandSchema>;
type GetWindowsIdByMultiplePidsVariables = z.infer<typeof getWindowsIdByMultiplePidsVariablesSchema>;
type GetWindowCommand = z.infer<typeof getWindowCommandSchema>;

const getWindowCommandsSchema = z.union([
  getWindowsIdByPidCommandSchema,
  getActiveWindowCommandSchema,
  getWindowsIdByMutliplePidsCommandSchema,
]).describe('Allows to get information about windows, transform and move them');

// Export all schemas
export {
  getWindowsIdByMultiplePidsCommandVariablesSchema,
  getWindowsIdByMutliplePidsCommandSchema,
  getWindowCommandsSchema,
  windowIdVariablesSchema,
  getWindowsIdByPidCommandVariablesSchema,
  windowIdVariablesCommandSchema,
  getWindowsIdByPidCommandSchema,
  getWindowsIdByPidVariablesSchema,
  getActiveWindowCommandSchema,
};

// Export all types
export type {
  GetWindowCommand,
  GetWindowsIdByMultiplePidsVariables,
  WindowIdVariables,
  GetWindowsIdByPidVariables,
  GetWindowsIdByPidCommand,
  GetActiveWindowCommand,
};
