import {z} from 'zod';
import {getMonitorCommandsSchema} from '@/config/types/get-commands/get-monitor-commands-schema';
import {baseGetInfoCommandSchema, getProcessCommandsSchema} from '@/config/types/get-commands/get-process-commands-schema';
import {getWindowCommandsSchema} from '@/config/types/get-commands/get-window-commands-schema';


// Individual command schemas
const pingCommandSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('ping'),
}).strict().describe('Pings this client to test whether it\'s working');


// Union of all command schemas
const getInfoCommandSchema = z.union([
  pingCommandSchema,
  getMonitorCommandsSchema,
  getProcessCommandsSchema,
  getWindowCommandsSchema,
]).describe('Allows to execute getRequest on remote schema and assign it to a variable');

// Type definitions
type PingCommand = z.infer<typeof pingCommandSchema>;
type GetInfoRemoteCommand = z.infer<typeof getInfoCommandSchema>;


// Export all schemas
export {
  pingCommandSchema,
  getInfoCommandSchema,
};


// Export all types
export type {
  PingCommand,
  GetInfoRemoteCommand,
};
