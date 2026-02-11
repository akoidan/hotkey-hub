import {z} from 'zod';
import {makeVariableUnion} from '@/config/types/variables';
import {baseGetInfoCommandSchema} from '@/config/types/get-commands/get-commands-shared';

const getPidsByNameVariablesSchema = z.object({
  name: z.string()
    .describe('Name of the executable file to search for. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
}).strict();

const getPidsByNameCommandVariablesSchema = makeVariableUnion(getPidsByNameVariablesSchema);

const getPidsByNameCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getPidsByName'),
  variables: getPidsByNameCommandVariablesSchema,
}).strict().describe('Gets list of process ids that match criteria');

const getProcessMainWindowVariablesSchema = z.object({
  pid: z.number().int().positive('Process ID must be a positive integer'),
}).strict();

const getProcessMainWindowCommandVariablesSchema = makeVariableUnion(getProcessMainWindowVariablesSchema);

const getProcessMainWindowCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getProcessMainWindow'),
  variables: getProcessMainWindowCommandVariablesSchema,
}).strict().describe('Get process\'s main window');

type GetPidsByNameVariables = z.infer<typeof getPidsByNameVariablesSchema>;
type GetProcessMainWindowVariables = z.infer<typeof getProcessMainWindowVariablesSchema>;
type GetPidsByNameCommand = z.infer<typeof getPidsByNameCommandSchema>;
type GetProcessMainWindowCommand = z.infer<typeof getProcessMainWindowCommandSchema>;
type GetPidsByNameCommandVariables = z.infer<typeof getPidsByNameVariablesSchema>;

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
  getPidsByNameCommandVariablesSchema,
  getProcessMainWindowCommandVariablesSchema,
  getPidsByNameVariablesSchema,
  getProcessMainWindowVariablesSchema,
};

// Export all types
export type {
  GetPidsByNameCommandVariables,
  GetPidsByNameVariables,
  GetProcessMainWindowVariables,
  GetPidsByNameCommand,
  GetProcessMainWindowCommand,
};