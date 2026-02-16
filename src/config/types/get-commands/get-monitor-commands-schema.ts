import {z} from 'zod';
import {makeVariableUnion} from '@/config/types/variables';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands-shared';
import {windowIdVariablesSchema} from '@/config/types/get-commands/get-window-commands-schema';

const getMonitorsCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitors'),
}).strict().describe('List monitors');

const monitorVariablesSchema = z.object({
  mid: z.number().int().nonnegative('Monitor ID must be a non-negative integer'),
}).strict();

const monitorVariablesCommandSchema = makeVariableUnion(monitorVariablesSchema);

const getMonitorInfoCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getMonitorInfo'),
  variables: monitorVariablesCommandSchema,
}).strict().describe('Get monitor info');

const getMonitorCommandsSchema = z.union([
  getMonitorsCommandSchema,
  getMonitorInfoCommandSchema,
]).describe('Allows to get information about display and its windows');


type GetMonitorsCommand = z.infer<typeof getMonitorsCommandSchema>;
type GetMonitorInfoCommand = z.infer<typeof getMonitorInfoCommandSchema>;
type MonitorVariables = z.infer<typeof monitorVariablesSchema>;

// Export all schemas
export {
  getMonitorCommandsSchema,
  windowIdVariablesSchema,
  monitorVariablesCommandSchema,
  getMonitorsCommandSchema,
  getMonitorInfoCommandSchema,
};

// Export all types
export type {
  GetMonitorsCommand,
  GetMonitorInfoCommand,
  MonitorVariables,
};