import {z} from 'zod';

// Base schema for all commands without variables
const baseCommandSchema = z.object({
  get: z.string(),
  assignVariable: z.string(),
}).strict();

// Reusable schemas
const windowIdVariablesSchema = z.object({
  wid: z.number().int().positive('Window ID must be a positive integer'),
}).strict();

// Individual command schemas
const pingSchema = baseCommandSchema.extend({
  get: z.literal('ping'),
}).strict();

const getWindowsIdByPidSchema = baseCommandSchema.extend({
  get: z.literal('getWindowsIdByPid'),
  variables: z.object({
    id: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict();

const getActiveWindowIdSchema = baseCommandSchema.extend({
  get: z.literal('getActiveWindowId'),
}).strict();

const getActiveWindowSchema = baseCommandSchema.extend({
  get: z.literal('getActiveWindow'),
}).strict();

const getWindowBoundsSchema = baseCommandSchema.extend({
  get: z.literal('getWindowBounds'),
  variables: windowIdVariablesSchema,
}).strict();

const getWindowTitleSchema = baseCommandSchema.extend({
  get: z.literal('getWindowTitle'),
  variables: windowIdVariablesSchema,
}).strict();

const getWindowOpacitySchema = baseCommandSchema.extend({
  get: z.literal('getWindowOpacity'),
  variables: windowIdVariablesSchema,
}).strict();

const getWindowOwnerSchema = baseCommandSchema.extend({
  get: z.literal('getWindowOwner'),
  variables: windowIdVariablesSchema,
}).strict();

const isWindowSchema = baseCommandSchema.extend({
  get: z.literal('isWindow'),
  variables: windowIdVariablesSchema,
}).strict();

const isWindowVisibleSchema = baseCommandSchema.extend({
  get: z.literal('isWindowVisible'),
  variables: windowIdVariablesSchema,
}).strict();

const getMonitorsSchema = baseCommandSchema.extend({
  get: z.literal('getMonitors'),
}).strict();

const monitorVariablesSchema = z.object({
  mid: z.number().int().nonnegative('Monitor ID must be a non-negative integer'),
}).strict();

const getMonitorInfoSchema = baseCommandSchema.extend({
  get: z.literal('getMonitorInfo'),
  variables: monitorVariablesSchema,
}).strict();

const getMonitorFromWindowSchema = baseCommandSchema.extend({
  get: z.literal('getMonitorFromWindow'),
  variables: windowIdVariablesSchema,
}).strict();

const getMonitorScaleFactorSchema = baseCommandSchema.extend({
  get: z.literal('getMonitorScaleFactor'),
  variables: monitorVariablesSchema,
}).strict();

const getProcessMainWindowSchema = baseCommandSchema.extend({
  get: z.literal('getProcessMainWindow'),
  variables: z.object({
    pid: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict();

// Union of all command schemas
const executeRequestRemoteCommandSchema = z.union([
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
]).describe('Allows to execute getRequest on remote schema and assign it to a variable');

// Type definitions
type BaseCommand = z.infer<typeof baseCommandSchema>;
type WindowIdVariables = z.infer<typeof windowIdVariablesSchema>;
type MonitorVariables = z.infer<typeof monitorVariablesSchema>;
type PingCommand = z.infer<typeof pingSchema>;
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
type ExecuteRequestRemoteCommand = z.infer<typeof executeRequestRemoteCommandSchema>;


// Export all schemas
export {
  baseCommandSchema,
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
  executeRequestRemoteCommandSchema,
};


// Export all types
export type {
  BaseCommand,
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
  ExecuteRequestRemoteCommand,
};
