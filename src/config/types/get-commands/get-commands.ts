import {z} from 'zod';
import {getMonitorCommands} from '@/config/types/get-commands/get-monitor-commands';
import {baseGetInfoCommandSchema, getProcessCommands} from '@/config/types/get-commands/get-process-commands';
import {getWindowCommands} from '@/config/types/get-commands/get-window-commands';


// Individual command schemas
const pingSchema = baseGetInfoCommandSchema.extend({
  get: z.literal('ping'),
}).strict().describe('Pings this client to test whether it\'s working');


// Union of all command schemas
const getInfoCommandSchema = z.union([
  pingSchema,
  getMonitorCommands,
  getProcessCommands,
  getWindowCommands,
]).describe('Allows to execute getRequest on remote schema and assign it to a variable');

// Type definitions
type PingCommand = z.infer<typeof pingSchema>;
type GetInfoRemoteCommand = z.infer<typeof getInfoCommandSchema>;


// Export all schemas
export {
  pingSchema,
  getInfoCommandSchema,
};


// Export all types
export type {
  PingCommand,
  GetInfoRemoteCommand,
};
