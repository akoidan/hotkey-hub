import {z} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands-shared';

const getPidsByNameCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getPidsByName'),
  variables: z.object({
    name: z.union([variableValueSchema, z.string()])
      .describe('Name of the executable file to search for. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
  }).strict(),
}).strict().describe('Gets list of process ids that match criteria');

const getProcessMainWindowCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getProcessMainWindow'),
  variables: z.object({
    pid: z.number().int().positive('Process ID must be a positive integer'),
  }).strict(),
}).strict().describe('Get process\' main window');

type GetPidsByNameCommand = z.infer<typeof getPidsByNameCommandSchema>;
type GetProcessMainWindowCommand = z.infer<typeof getProcessMainWindowCommandSchema>;


const getProcessCommandsSchema = z.union([
  getPidsByNameCommandSchema,
  getProcessMainWindowCommandSchema,
]).describe('Handles processes');

// Export all schemas
export {
  getProcessCommandsSchema,
  getPidsByNameCommandSchema,
  baseGetInfoCommandSchema,
  getProcessMainWindowCommandSchema,
};


// Export all types
export type {
  GetPidsByNameCommand,
  GetProcessMainWindowCommand,
};