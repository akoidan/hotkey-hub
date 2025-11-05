/* eslint-disable max-lines, @typescript-eslint/no-use-before-define */
import {z, ZodIssueCode, type ZodType} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {type VariableValue, variableValueSchema} from '@/config/types/variables';
import {delayCommandsSchema, type RemoteCommand, remoteCommandSchema} from '@/config/types/remote-commands';


const expressionDescription = 'JS like expression that evaluates to some values. E.g. x*2.';

const macroLocalCommandSchema = z.object({
  macro: z.string().describe('Name of the macro to execute, which must match a key defined in the macros section. ' +
    'Macros help reduce configuration repetition by reusing command sequences.'),
  variables: z.record(z.union([z.string(), z.number(), variableValueSchema])).optional()
    .describe('Variables to pass to the macro. Object where keys are variable names and values are their values. ' +
      'Values can be strings or numbers and must match the types defined in the macro\'s variables section.'),
})
  .strict()
  .merge(delayCommandsSchema)
  .superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = schemaRootCache.macros!;
    if (!definedMacros[command.macro]) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['macro'],
        message: `Macro ${command.macro} doesn't exist. Available macros are ${Object.keys(definedMacros).join(', ')}`,
      });
    }
  }).superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = schemaRootCache.macros!;
    if (!definedMacros[command.macro] || !command.variables) {
      return;
    }
    for (const [key, value] of Object.entries(command.variables!)) {
      if (!definedMacros[command.macro]?.variables?.[key]) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['variables'],
          message: `Passed variable ${key}=${String(value)} doesn't have a description on macro`,
        });
      }
    }
  }).superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = schemaRootCache.macros!;
    if (!definedMacros[command.macro] || !command.variables) {
      return;
    }
    const variables = definedMacros[command.macro]?.variables;
    if (!variables) {
      return;
    }
    for (const [key, value] of Object.entries(variables)) {
      let isVariable = false;
      if ((command.variables?.[key] as VariableValue)?.$ref) {
        isVariable = true;
      }
      if (command.variables?.[key] && value!.type !== typeof command.variables?.[key] && !isVariable) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['variables'],
          message: `Passed variable ${key}=${JSON.stringify(command.variables?.[key])} type of ${typeof command.variables?.[key]},`+
           `expected ${value!.type}`,
        });
      }
      if (!value!.optional && !command.variables?.[key]) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['variables'],
          message: `macro ${command.macro} requires variable ${key} but only ${JSON.stringify(command.variables)} were passed`,
        });
      }
    }
  }).describe('Executes a predefined macro, which is a reusable sequence of commands. ' +
    'Similar to a function call, macros can accept parameters through variables. ' +
    'This helps avoid duplicating complex command sequences and makes configurations more maintainable.');


// Define reusable field schemas
const fieldDescriptions = {
  reloadConfig: 'Path to a new config. Leave it empty to use current path',
  reloadMacro: 'Path to a new macro config file. Leave it empty to use current path',
  reloadVariables: 'Path to a variable config file. Leave it empty to use current path',
};

// Base: all optional
const base = z.object({
  reloadConfig: z.string().optional().describe(fieldDescriptions.reloadConfig),
  reloadMacro: z.string().optional().describe(fieldDescriptions.reloadMacro),
  reloadVariables: z.string().optional().describe(fieldDescriptions.reloadVariables),
}).strict();

// Helper: mark one field as required+nonempty
function requireField<K extends keyof typeof fieldDescriptions>(
  key: K
): z.ZodObject<{ [P in keyof typeof fieldDescriptions]: P extends K ? z.ZodString : z.ZodOptional<z.ZodString>; }, 'strict'> {
  return base.extend({
    [key]: z.string().nonempty().describe(fieldDescriptions[key]),
  }) as z.ZodObject<{ [P in keyof typeof fieldDescriptions]: P extends K ? z.ZodString : z.ZodOptional<z.ZodString>; }, 'strict'>;
}

const reloadConfigLocalCommandSchema = z.union([
  requireField('reloadConfig'),
  requireField('reloadMacro'),
  requireField('reloadVariables'),
]).describe('Reloads config or loads config from a new place');

const expressionLocalCommandSchema = z.object({
  assignVariable: z.string().describe('Name of the variable to store the expression result. ' +
    'This variable can be referenced in subsequent commands using {{variableName}} syntax.'),
  expression: z.string().superRefine((expr, ctx) => {
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
  }).describe(expressionDescription),
}).strict()
  .describe('Allows to create/assign a variable by expression. In this case you need to set "destination" property to a string "null"');


const ifLocalCommandSchema = z.lazy(() => z.object({
  if: z.string().nonempty().superRefine((expr, ctx) => {
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
  }).describe(expressionDescription),
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
  commands: z.array(unknownCommandSchema),
}).describe('List of commands to execute in a single thread.' +
  ' Commands run sequentially in their thread, while threads run in parallel.') as any as ZodType<Thread>;  // z.lazy requires manual type definition cause of reqursive type

const loopLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Sequence of commands to repeat in the loop. ' +
    'Each iteration will execute all commands in order.'),
  loop: z.number()
    .describe('Number of times to repeat the commands sequence. ' +
      'Positive number: Executes that many iterations. ' +
      'Negative number: Runs indefinitely until manually stopped. ' +
      'If the parent command is pausable, pressing the shortcut again will exit the loop.'),
  // z.lazy requires manual type definition cause of reqursive type
}).strict()).describe(
  'Allow to run same commands multiple time or in iteration or loop'
) as any as ZodType<{ commands: UnknownCommand[], loop: number }>;

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
  print: z.string().superRefine((expr, ctx) => {
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
  }).describe(expressionDescription),
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

const macroVariablesDescriptionSchema = z.record(z.object({
  type: z.enum(['string', 'number']).describe('To validate the type, or cast from env variables'),
  optional: z.boolean().optional().describe('If set to true, the key is be removed is var is not passed'),
}).strict()
  .optional())
  .describe('Set of variables descriptors for macro');


const macroDefinitionSchema = z.object({
  commands: z.array(unknownCommandSchema).describe('Set of commands for this macro'),
  variables: macroVariablesDescriptionSchema,
})
  .strict()
  .describe('A reusable command sequence that can accept variables. Similar to a function that runs a predefined set of commands.');

const macrosListSchema = z.record(macroDefinitionSchema)
  .optional()
  .describe('A map of macros where a key is the macro name and value is its body');

type ExpressionLocalCommand = z.infer<typeof expressionLocalCommandSchema>;
type ReloadConfigLocalCommand = z.infer<typeof reloadConfigLocalCommandSchema>;
type MacroLocalCommand = z.infer<typeof macroLocalCommandSchema>
type ShuffleLocalCommand = z.infer<typeof shuffleLocalCommandSchema>
type PrintLocalCommand = z.infer<typeof printLocalCommandSchema>
type TransactionLocalCommand = z.infer<typeof transactionLocalCommandSchema>
type ThreadsLocalCommand = z.infer<typeof threadsLocalCommandSchema>
type LoopLocalCommand = z.infer<typeof loopLocalCommandSchema>
type IfLocalCommand = z.infer<typeof ifLocalCommandSchema>
type MacroList = z.infer<typeof macrosListSchema>
type VariablesDefinition = z.infer<typeof macroVariablesDescriptionSchema>

interface Thread {
  name: string,
  commands: UnknownCommand[]
}

type UnknownCommand = RemoteCommand
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
