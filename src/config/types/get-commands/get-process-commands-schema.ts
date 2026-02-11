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

const getProcessInfoVariablesSchema = z.object({
  pid: z.number().int().positive('Process ID must be a positive integer'),
}).strict();

const getProcessInfoCommandVariablesSchema = makeVariableUnion(getProcessInfoVariablesSchema);

const getProcessInfoCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('getProcessInfo'),
  variables: getProcessInfoCommandVariablesSchema,
}).strict().describe('Get process\'s main window');

type GetPidsByNameVariables = z.infer<typeof getPidsByNameVariablesSchema>;
type GetProcessMainWindowVariables = z.infer<typeof getProcessInfoVariablesSchema>;
type GetPidsByNameCommand = z.infer<typeof getPidsByNameCommandSchema>;
type GetProcessMainWindowCommand = z.infer<typeof getProcessInfoCommandSchema>;
type GetPidsByNameCommandVariables = z.infer<typeof getPidsByNameVariablesSchema>;

const getProcessCommandsSchema = z.union([
  getPidsByNameCommandSchema,
  getProcessInfoCommandSchema,
]).describe('Handles processes');

// Export all schemas
export {
  getProcessCommandsSchema,
  getPidsByNameCommandSchema,
  getProcessInfoCommandSchema,
  getPidsByNameCommandVariablesSchema,
  getProcessInfoCommandVariablesSchema,
  getPidsByNameVariablesSchema,
  getProcessInfoVariablesSchema,
};

// Export all types
export type {
  GetPidsByNameCommandVariables,
  GetPidsByNameVariables,
  GetProcessMainWindowVariables,
  GetPidsByNameCommand,
  GetProcessMainWindowCommand,
};