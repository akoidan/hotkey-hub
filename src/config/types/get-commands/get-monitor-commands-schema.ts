import {z} from 'zod';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands-shared';
import {windowIdVariablesSchema} from '@/config/types/get-commands/get-window-commands-schema';

const getMonitorsCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitors'),
}).strict().describe('List monitors');

const monitorVariablesSchema = z.object({
  mid: z.number().int().nonnegative('Monitor ID must be a non-negative integer'),
}).strict();

const getMonitorInfoCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitorInfo'),
  variables: monitorVariablesSchema,
}).strict().describe('Get monitor info');

const getMonitorFromWindowCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitorFromWindow'),
  variables: windowIdVariablesSchema,
}).strict().describe('Get monitor for window');

const getMonitorScaleFactorCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitorScaleFactor'),
  variables: monitorVariablesSchema,
}).strict().describe('Get monitor scale factor');


const getMonitorCommandsSchema = z.union([
  getMonitorsCommandSchema,
  getMonitorInfoCommandSchema,
  getMonitorFromWindowCommandSchema,
  getMonitorScaleFactorCommandSchema,
]).describe('Allows to get information about display and its windows');

type MonitorVariables = z.infer<typeof monitorVariablesSchema>;
type GetMonitorsCommand = z.infer<typeof getMonitorsCommandSchema>;
type GetMonitorInfoCommand = z.infer<typeof getMonitorInfoCommandSchema>;
type GetMonitorFromWindowCommand = z.infer<typeof getMonitorFromWindowCommandSchema>;
type GetMonitorScaleFactorCommand = z.infer<typeof getMonitorScaleFactorCommandSchema>;

// Export all schemas
export {
  getMonitorCommandsSchema,
  windowIdVariablesSchema,
  monitorVariablesSchema,
  getMonitorsCommandSchema,
  getMonitorInfoCommandSchema,
  getMonitorFromWindowCommandSchema,
  getMonitorScaleFactorCommandSchema,
};


// Export all types
export type {
  MonitorVariables,
  GetMonitorsCommand,
  GetMonitorInfoCommand,
  GetMonitorFromWindowCommand,
  GetMonitorScaleFactorCommand,
};