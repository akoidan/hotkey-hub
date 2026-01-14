import {z} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands';
import {
  getMonitorFromWindowSchema,
  getMonitorInfoSchema,
  getMonitorScaleFactorSchema,
  getMonitorsSchema
} from '@/config/types/get-commands/get-monitor-commands';


const getPidsByNameSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getPidsByName'),
  variables: z.object({
    name: z.union([variableValueSchema, z.string()])
      .describe('Name of the executable file to search for. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
  }).strict(),
}).strict().describe('Gets list of process ids that match criteria');

const getProcessMainWindowSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getProcessMainWindow'),
  variables: z.object({
    pid: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict().describe('Get process\' main window');

type GetPidsByNameCommand = z.infer<typeof getPidsByNameSchema>;
type GetProcessMainWindowCommand = z.infer<typeof getProcessMainWindowSchema>;


const getProcessAllSchema = z.union([
  getPidsByNameSchema,
  getProcessMainWindowSchema,
]).describe('Handles processes');

// Export all schemas
export {
  getProcessAllSchema,
  getPidsByNameSchema,
  baseGetInfoCommandSchema,
  getProcessMainWindowSchema,
};


// Export all types
export type {
  GetPidsByNameCommand,
  GetProcessMainWindowCommand,
};