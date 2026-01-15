import {z} from 'zod';
import {getMonitorAllSchemas} from '@/config/types/get-commands/get-monitor-commands';
import {baseGetInfoCommandSchema, getProcessAllSchema} from '@/config/types/get-commands/get-process-commands';
import {getWindowAllSchema} from '@/config/types/get-commands/get-window-commands';


// Individual command schemas
const pingSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('ping'),
}).strict().describe('Pings this client to test whether it\'s working');


// Union of all command schemas
const getInfoRemoteCommandSchema = z.union([
  pingSchema,
  getMonitorAllSchemas,
  getProcessAllSchema,
  getWindowAllSchema,
]).describe('Allows to execute getRequest on remote schema and assign it to a variable');

// Type definitions
type PingCommand = z.infer<typeof pingSchema>;
type GetInfoRemoteCommand = z.infer<typeof getInfoRemoteCommandSchema>;


// Export all schemas
export {
  pingSchema,
  getInfoRemoteCommandSchema,
};


// Export all types
export type {
  PingCommand,
  GetInfoRemoteCommand,
};
