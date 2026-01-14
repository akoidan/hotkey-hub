import {z} from 'zod';
import {baseGetInfoCommandSchema, pingSchema, windowIdVariablesSchema} from '@/config/types/get-commands/get-commands';

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


const getMonitorAllSchemas = z.union([
  getMonitorsSchema,
  getMonitorInfoSchema,
  getMonitorFromWindowSchema,
  getMonitorScaleFactorSchema,
]).describe('Allows to get information about display and its windows');

type MonitorVariables = z.infer<typeof monitorVariablesSchema>;
type GetMonitorsCommand = z.infer<typeof getMonitorsSchema>;
type GetMonitorInfoCommand = z.infer<typeof getMonitorInfoSchema>;
type GetMonitorFromWindowCommand = z.infer<typeof getMonitorFromWindowSchema>;
type GetMonitorScaleFactorCommand = z.infer<typeof getMonitorScaleFactorSchema>;

// Export all schemas
export {
  getMonitorAllSchemas,
  windowIdVariablesSchema,
  monitorVariablesSchema,
  getMonitorsSchema,
  getMonitorInfoSchema,
  getMonitorFromWindowSchema,
  getMonitorScaleFactorSchema,
};


// Export all types
export type {
  MonitorVariables,
  GetMonitorsCommand,
  GetMonitorInfoCommand,
  GetMonitorFromWindowCommand,
  GetMonitorScaleFactorCommand,
};