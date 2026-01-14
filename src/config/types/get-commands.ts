import {z} from 'zod';
import {baseDestinationSchema, variableValueSchema} from '@/config/types/remote-commands';

// Base schema for all commands without variables
const baseGetInfoCommandSchema = baseDestinationSchema.extend({
  get: z.string(),
  assignVariable: z.string(),
}).strict();

// Reusable schemas
const windowIdVariablesSchema = z.object({
  wid: z.number().int().positive('Window ID must be a positive integer'),
}).strict();

// Individual command schemas
const pingSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('ping'),
}).strict().describe('Pings this client to test whether it\'s working');

const getWindowsIdByPidSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getWindowsIdByPid'),
  variables: z.object({
    id: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict().describe('Get all windows with their IDs for a concrete process id');

const getPidsByNameSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getPidsByName'),
  variables: z.object({
    name: z.union([variableValueSchema, z.string()])
      .describe('Name of the executable file to search for. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
  }).strict(),
}).strict().describe('Gets list of process ids that match criteria');

const getActiveWindowIdSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getActiveWindowId'),
}).strict().describe('Get active window id (raw handle)');

const getActiveWindowSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getActiveWindow'),
}).strict().describe('Get information about current active window');

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

const isWindowSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('isWindow'),
  variables: windowIdVariablesSchema,
}).strict().describe('Check if handle is a window');

const isWindowVisibleSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('isWindowVisible'),
  variables: windowIdVariablesSchema,
}).strict().describe('Check if window is visible');

const getMonitorsSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitors'),
}).strict().describe('List monitors');

const monitorVariablesSchema = z.object({
  mid: z.number().int().nonnegative('Monitor ID must be a non-negative integer'),
}).strict();

const getMonitorInfoSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitorInfo'),
  variables: monitorVariablesSchema,
}).strict().describe('Get monitor info');

const getMonitorFromWindowSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitorFromWindow'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get monitor for window');

const getMonitorScaleFactorSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitorScaleFactor'),
  variables: monitorVariablesSchema,
}).strict().describe('Get monitor scale factor');

const getProcessMainWindowSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getProcessMainWindow'),
  variables: z.object({
    pid: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict().describe('Get process\' main window');

// Union of all command schemas
const getInfoRemoteCommandSchema = z.union([
  pingSchema,
  getWindowsIdByPidSchema,
  getActiveWindowIdSchema,
  getActiveWindowSchema,
  getWindowBoundsSchema,
  getWindowTitleSchema,
  getWindowOpacitySchema,
  getWindowOwnerSchema,
  isWindowSchema,
  isWindowVisibleSchema,
  getMonitorsSchema,
  getMonitorInfoSchema,
  getMonitorFromWindowSchema,
  getMonitorScaleFactorSchema,
  getProcessMainWindowSchema,
  getPidsByNameSchema,
]).describe('Allows to execute getRequest on remote schema and assign it to a variable');

// Type definitions
type WindowIdVariables = z.infer<typeof windowIdVariablesSchema>;
type MonitorVariables = z.infer<typeof monitorVariablesSchema>;
type PingCommand = z.infer<typeof pingSchema>;
type GetPidsByNameCommand = z.infer<typeof getPidsByNameSchema>;
type GetWindowsIdByPidCommand = z.infer<typeof getWindowsIdByPidSchema>;
type GetActiveWindowIdCommand = z.infer<typeof getActiveWindowIdSchema>;
type GetActiveWindowCommand = z.infer<typeof getActiveWindowSchema>;
type GetWindowBoundsCommand = z.infer<typeof getWindowBoundsSchema>;
type GetWindowTitleCommand = z.infer<typeof getWindowTitleSchema>;
type GetWindowOpacityCommand = z.infer<typeof getWindowOpacitySchema>;
type GetWindowOwnerCommand = z.infer<typeof getWindowOwnerSchema>;
type IsWindowCommand = z.infer<typeof isWindowSchema>;
type IsWindowVisibleCommand = z.infer<typeof isWindowVisibleSchema>;
type GetMonitorsCommand = z.infer<typeof getMonitorsSchema>;
type GetMonitorInfoCommand = z.infer<typeof getMonitorInfoSchema>;
type GetMonitorFromWindowCommand = z.infer<typeof getMonitorFromWindowSchema>;
type GetMonitorScaleFactorCommand = z.infer<typeof getMonitorScaleFactorSchema>;
type GetProcessMainWindowCommand = z.infer<typeof getProcessMainWindowSchema>;
type GetInfoRemoteCommand = z.infer<typeof getInfoRemoteCommandSchema>;


// Export all schemas
export {
  getPidsByNameSchema,
  baseGetInfoCommandSchema,
  windowIdVariablesSchema,
  monitorVariablesSchema,
  pingSchema,
  getWindowsIdByPidSchema,
  getActiveWindowIdSchema,
  getActiveWindowSchema,
  getWindowBoundsSchema,
  getWindowTitleSchema,
  getWindowOpacitySchema,
  getWindowOwnerSchema,
  isWindowSchema,
  isWindowVisibleSchema,
  getMonitorsSchema,
  getMonitorInfoSchema,
  getMonitorFromWindowSchema,
  getMonitorScaleFactorSchema,
  getProcessMainWindowSchema,
  getInfoRemoteCommandSchema,
};


// Export all types
export type {
  GetPidsByNameCommand,
  WindowIdVariables,
  MonitorVariables,
  PingCommand,
  GetWindowsIdByPidCommand,
  GetActiveWindowIdCommand,
  GetActiveWindowCommand,
  GetWindowBoundsCommand,
  GetWindowTitleCommand,
  GetWindowOpacityCommand,
  GetWindowOwnerCommand,
  IsWindowCommand,
  IsWindowVisibleCommand,
  GetMonitorsCommand,
  GetMonitorInfoCommand,
  GetMonitorFromWindowCommand,
  GetMonitorScaleFactorCommand,
  GetProcessMainWindowCommand,
  GetInfoRemoteCommand,
};
