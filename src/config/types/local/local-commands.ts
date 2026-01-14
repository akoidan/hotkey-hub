/* eslint-disable max-lines, @typescript-eslint/no-use-before-define */
import {z, ZodIssueCode, type ZodType} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {type VariableValue, variableValueSchema} from '@/config/types/variables';
import {delayCommandsSchema} from '@/config/types/remote/base-remote-command';
import {type RemoteCommand, remoteCommandSchema} from '@/config/types/remote/remote-commands';
import {type GetInfoRemoteCommand, getInfoRemoteCommandSchema} from '@/config/types/get-commands/get-commands';


const expressionSchema = z.string().superRefine((expr, ctx) => {
  try {
    // eslint-disable-next-line
    new Function(`return (${expr});`);
  } catch (e) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      path: [],
      message: `"${expr}" is not a valid expression, because of ${e?.message ?? e}`,
    });
  }
}).describe('JS like expression that evaluates to some values. E.g. x*2.');

const expressionLocalCommandSchema = z.object({
  assignVariable: z.string().describe('Name of the variable to store the expression result. ' +
    'This variable can be referenced in subsequent commands using {{variableName}} syntax.'),
  expression: expressionSchema,
}).strict()
  .describe('Allows to create/assign a variable by expression.');


const ifLocalCommandSchema = z.lazy(() => z.object({
  if: expressionSchema,
  then: z.array(unknownCommandSchema)
    .describe('Commands to execute if the condition is true'),
  else: z.array(unknownCommandSchema)
    .optional()
    .describe('Optional commands to execute if the condition is false'),
}).strict()).describe('Conditional execution of commands based on a boolean condition. ' +
  'If the condition is true, executes the "then" commands, otherwise executes the "else" commands if they exist.') as any as ZodType<{
  if: string,
  then: UnknownCommand[],
  else?: UnknownCommand[]
}>;

const unknownCommandSchema = z.lazy(() => z.union([
  remoteCommandSchema,
  getInfoRemoteCommandSchema,
  macroLocalCommandSchema,
  expressionLocalCommandSchema,
  transactionLocalCommandSchema,
  threadsLocalCommandSchema,
  loopLocalCommandSchema,
  ifLocalCommandSchema,
  shuffleLocalCommandSchema,
  printLocalCommandSchema,
  reloadConfigLocalCommandSchema,
])).describe('A command that would be executed on this machine') as ZodType<UnknownCommand>; // z.lazy requires manual type definition cause of reqursive type

const transactionLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema)
    .describe('Commands to execute atomically in this transaction. All commands either succeed or fail together.'),
  transaction: z.union([variableValueSchema, z.string()])
    .describe('Unique name for the transaction. Helps with logging and debugging transaction execution.'),
}).strict()).describe('Run commands in a transaction.' +
  ' Prevents concurrent transactions with same name.' +
  ' Uses PC name for remote commands. Ensures atomic execution.') as any as ZodType<{ commands: UnknownCommand[], transaction: string }>;


const threadLocalArraySchema = z.object({
  name: z.string().max(10).nonempty().describe('name of the thread, required for req-id log, '),
  commands: z.array(unknownCommandSchema).describe('list of commands in this thread'),
}).describe('List of commands to execute in a single thread.' +
  ' Commands run sequentially in their thread, while threads run in parallel.') as any as ZodType<Thread>;  // z.lazy requires manual type definition cause of reqursive type

const loopLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Sequence of commands to repeat in the loop. ' +
    'Each iteration will execute all commands in order.'),
  loop: z.union([z.number(), expressionSchema])
    .describe('Number of times to repeat the commands sequence. ' +
      'Positive number: Executes that many iterations. ' +
      'Negative number: Runs indefinitely until manually stopped. ' +
      'If the parent command is pausable, pressing the shortcut again will exit the loop.' +
      'If string is passed evaluated that string as expresssion and repeat the loop while it\'s true'),
  // z.lazy requires manual type definition cause of reqursive type
}).strict()).describe(
  'Allow to run same commands multiple time or in iteration or loop'
) as any as ZodType<{ commands: UnknownCommand[], loop: number | string }>;

enum ShufflePolicy {
  random = 'random',
  reverse = 'reverse',
  straight = 'straight',
}

const shufflePolicySchema = z.nativeEnum(ShufflePolicy)
  .describe('Random = shuffle array so it takes next element randomly.' +
    ' Reverse = each time it changes the order from first to last, then from last to first.' +
    ' Straight = Default order from first to last');

const shuffleLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Sequence of commands to repeat in the loop. ' +
    'Each iteration will execute all commands in order.'),
  shuffle: shufflePolicySchema,
  // z.lazy requires manual type definition cause of reqursive type
}).strict()).describe(
  'Allow to run same commands in specific order'
) as any as ZodType<{ commands: UnknownCommand[], shuffle: ShufflePolicy }>;


const printLocalCommandSchema = z.object({
  print: expressionSchema,
  // z.lazy requires manual type definition cause of reqursive type
})
  .strict()
  .describe(
    'Print the expressions to log'
  );

const threadsLocalCommandSchema = z.lazy(() => z.object({
  threads: z.array(threadLocalArraySchema).describe('Command sequences to run in parallel.' +
    ' Each thread runs sequentially while threads run simultaneously.'),
  // z.lazy requires manual type definition cause of reqursive type
}).strict()).describe('Allows to execute commands in parallel. Or in threads.') as ZodType<{ threads: Thread[] }>;




type ExpressionLocalCommand = z.infer<typeof expressionLocalCommandSchema>;

type ShuffleLocalCommand = z.infer<typeof shuffleLocalCommandSchema>
type PrintLocalCommand = z.infer<typeof printLocalCommandSchema>
type TransactionLocalCommand = z.infer<typeof transactionLocalCommandSchema>
type ThreadsLocalCommand = z.infer<typeof threadsLocalCommandSchema>
type LoopLocalCommand = z.infer<typeof loopLocalCommandSchema>
type IfLocalCommand = z.infer<typeof ifLocalCommandSchema>
type VariablesDefinition = z.infer<typeof macroVariablesDescriptionSchema>

interface Thread {
  name: string,
  commands: UnknownCommand[]
}

type UnknownCommand = RemoteCommand
  | GetInfoRemoteCommand
  | MacroLocalCommand
  | ExpressionLocalCommand
  | TransactionLocalCommand
  | ThreadsLocalCommand
  | ShuffleLocalCommand
  | PrintLocalCommand
  | LoopLocalCommand
  | IfLocalCommand
  | ReloadConfigLocalCommand;

export {
  ifLocalCommandSchema,
  loopLocalCommandSchema,
  threadsLocalCommandSchema,
  macroLocalCommandSchema,
  unknownCommandSchema,
  macroVariableValueSchema,
  expressionSchema,
  expressionLocalCommandSchema,
  transactionLocalCommandSchema,
  macroVariablesDescriptionSchema,
  macroDefinitionSchema,
  threadLocalArraySchema,
  macrosListSchema,
  printLocalCommandSchema,
  shuffleLocalCommandSchema,
  ShufflePolicy,
  reloadConfigLocalCommandSchema,
};

export type {
  IfLocalCommand,
  LoopLocalCommand,
  Thread,
  PrintLocalCommand,
  ShuffleLocalCommand,
  ThreadsLocalCommand,
  MacroLocalCommand,
  TransactionLocalCommand,
  ExpressionLocalCommand,
  VariablesDefinition,
  UnknownCommand,
  ReloadConfigLocalCommand,
  MacroList,
};
