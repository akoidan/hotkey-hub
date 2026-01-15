import {z} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';

console.log('process-commands.ts: variableValueSchema', !!variableValueSchema);
console.log('process-commands.ts: baseRemoteCommandSchema', !!baseRemoteCommandSchema);
const killExeByNameRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('killExeByName'),
  variables: z.object({
    name: z.union([variableValueSchema, z.string()])
      .describe('Name of the executable file to terminate. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
  }).strict(),
}).strict().describe('Terminates all processes with the specified executable name. Use with caution - kills all instances of the program.');

const killExeByPidRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('killExeByPid'),
  variables: z.object({
    pid: z.union([variableValueSchema, z.number()])
      .describe('Process ID (PID) of the process to terminate. Example: 1234. Must be a valid running process ID.'),
  }).strict(),
}).strict().describe('Terminates a specific process by its PID on the remote PC.' +
  ' More precise than killByName as it targets a single specific process.');


const launchExeRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('launchExe'),
  assignVariable: z.string().optional().describe('If provided, would assign launched process id to this variable'),
  variables: z.object({
    path: z.union([variableValueSchema, z.string()])
      .describe('Full absolute path to the executable file to run on the remote PC.'),
    arguments: z.union([variableValueSchema, z.array(z.string())]).default([]).optional()
      .describe('Command-line arguments to pass to the executable. Each array element is a separate argument.'),
    waitTillFinish: z.union([variableValueSchema, z.boolean()]).default(false).optional()
      .describe('If true, waits for the launched program to complete before executing the next command. ' +
        'If false (default), continues with next command immediately after launch.'),
  }).strict(),
}).strict().describe('Starts a program on a remote PC.');

const processAllSchemas = z.union([
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  launchExeRemoteCommandSchema,
]).describe('Process-related remote commands');

type ExecuteRemoteCommand = z.infer<typeof launchExeRemoteCommandSchema>
type KillExeByPidRemoteCommand = z.infer<typeof killExeByPidRemoteCommandSchema>
type KillExeByNameRemoteCommand = z.infer<typeof killExeByNameRemoteCommandSchema>

export type {
  ExecuteRemoteCommand,
  KillExeByPidRemoteCommand,
  KillExeByNameRemoteCommand,
};

export {
  launchExeRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  processAllSchemas,
};
