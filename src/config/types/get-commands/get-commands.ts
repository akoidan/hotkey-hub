import {z} from 'zod';
import {baseDestinationSchema} from '@/config/types/remote/base-remote-command';
import {getMonitorAllSchemas} from '@/config/types/get-commands/get-monitor-commands';
import {getProcessAllSchema} from '@/config/types/get-commands/get-process-commands';
import {getWindowAllSchema} from '@/config/types/get-commands/get-window-commands';

// Base schema for all commands without variables
const baseGetInfoCommandSchema = baseDestinationSchema.extend({
  get: z.string().describe('Name of this command'),
  assignVariable: z.string().describe('Assign result to a variable'),
}).strict();


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
  baseGetInfoCommandSchema,
  pingSchema,
  getInfoRemoteCommandSchema,
};


// Export all types
export type {
  PingCommand,
  GetInfoRemoteCommand,
};
