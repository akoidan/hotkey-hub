import {z} from 'zod';
import {makeVariableUnion} from '@/config/types/variables';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';

const killExeByNameRemoteVariableSchema = z.object({
  name: z.string()
    .describe('Name of the executable file to terminate. Example: "Chrome.exe". Case-sensitive on some operating systems.'),
}).strict();

const killExeByNameRemoteCommandVariableSchema = makeVariableUnion(killExeByNameRemoteVariableSchema);

const killExeByNameRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('killExeByName'),
  variables: killExeByNameRemoteCommandVariableSchema,
}).strict().describe('Terminates all processes with the specified executable name. Use with caution - kills all instances of the program.');

const killExeByPidRemoteVariableSchema = z.object({
  pid: z.number()
    .describe('Process ID (PID) of the process to terminate. Example: 1234. Must be a valid running process ID.'),
}).strict();

const killExeByPidRemoteCommandVariableSchema = makeVariableUnion(killExeByPidRemoteVariableSchema);

const killExeByPidRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('killExeByPid'),
  variables: killExeByPidRemoteCommandVariableSchema,
}).strict().describe('Terminates a specific process by its PID on the remote PC. ' +
  'More precise than killByName as it targets a single specific process.');

const launchExeRemoteVariableSchema = z.object({
  path: z.string()
    .describe('Full absolute path to the executable file to run on the remote PC.'),
  arguments: z.array(z.string()).default([]).optional()
    .describe('Command-line arguments to pass to the executable. Each array element is a separate argument.'),
  waitTillFinish: z.boolean().default(false).optional()
    .describe('If true, waits for the launched program to complete before executing the next command. ' +
      'If false (default), continues with next command immediately after launch.'),
}).strict();

const launchExeRemoteCommandVariableSchema = makeVariableUnion(launchExeRemoteVariableSchema);

const launchExeRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('launchExe'),
  assignVariable: z.string().optional().describe('If provided, would assign launched process id to this variable'),
  variables: launchExeRemoteCommandVariableSchema,
}).strict().describe('Starts a program on a remote PC.');

const processCommandsSchema = z.union([
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  launchExeRemoteCommandSchema,
]).describe('Process-related remote commands');

type KillExeByNameRemoteVariable = z.infer<typeof killExeByNameRemoteVariableSchema>;
type KillExeByPidRemoteVariable = z.infer<typeof killExeByPidRemoteVariableSchema>;
type LaunchExeRemoteVariable = Required<z.infer<typeof launchExeRemoteVariableSchema>>;
type LaunchExeRemoteCommand = z.infer<typeof launchExeRemoteCommandSchema>;
type KillExeByPidRemoteCommand = z.infer<typeof killExeByPidRemoteCommandSchema>;
type KillExeByNameRemoteCommand = z.infer<typeof killExeByNameRemoteCommandSchema>;

export type {
  KillExeByNameRemoteVariable,
  KillExeByPidRemoteVariable,
  LaunchExeRemoteVariable,
  LaunchExeRemoteCommand,
  KillExeByPidRemoteCommand,
  KillExeByNameRemoteCommand,
};

export {
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  processCommandsSchema,
};
