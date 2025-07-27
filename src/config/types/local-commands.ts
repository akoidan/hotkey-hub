/* eslint-disable max-lines, @typescript-eslint/no-use-before-define */
import {z, ZodIssueCode, type ZodType} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {variableRegex} from '@/config/types/variables';
import {type RemoteCommand, delayCommandsSchema, remoteCommandSchema} from '@/config/types/remote-commands';

const macroLocalCommandSchema = z.object({
  macro: z.string().describe('Name of the macro to execute, which must match a key defined in the macros section. ' +
    'Macros help reduce configuration repetition by reusing command sequences.'),
  variables: z.record(z.union([z.string(), z.number()])).optional()
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
          message: `Passed variable ${key}=${value} doesn't have a description on macro`,
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
      if (typeof command.variables?.[key] === 'string' && variableRegex.test(command.variables?.[key])) {
        isVariable = true;
      }
      if (command.variables?.[key] && value!.type !== typeof command.variables?.[key] && !isVariable) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['variables'],
          message: `Passed variable ${key}=${command.variables?.[key]} type of ${typeof command.variables?.[key]}, expected ${value!.type}`,
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
  }).describe('JS like expression that evaluates to some values. E.g. x*2.'),
}).strict()
  .describe('Allows to create/assign a variable by expression. In this case you need to set "destination" property to a string "null"');

const unknownCommandSchema = z.lazy(() => z.union([
  remoteCommandSchema,
  macroLocalCommandSchema,
  expressionLocalCommandSchema,
  transactionLocalCommandSchema,
  threadsLocalCommandSchema,
  loopLocalCommandSchema,
])).describe('A command that would be executed on this machine') as ZodType<UnkownCommand>; // z.lazy requires manual type definition cause of reqursive type

const transactionLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Sequence of commands to execute as part of this transaction. ' +
    'All commands in a transaction are executed atomically - they either all succeed or all fail.'),
  transaction: z.string().describe('Unique name for the transaction. Helps with logging and debugging transaction execution.'),
})).describe('Allow to run commands in a transaction. By specifying transaction name you will prevent having 2 transaction with the same name at the time.' +
  ' By default all remote commands run in transaction with a transaction name of a remotePc from ips section of this config.' +
  ' For example if you specify same transaction name you can prevent running other commands in the middle of this transaction' +
  ' with the same transaction name.') as any as ZodType<{ commands: UnkownCommand[], transaction: string }>;

const threadLocalArraySchema = z.array(unknownCommandSchema)
  .describe('List of commands to execute in a single thread. Commands within a thread run sequentially, ' +
    'but different threads run in parallel. This allows for complex timing and coordination between commands.') as any as ZodType<UnkownCommand[]>;  // z.lazy requires manual type definition cause of reqursive type

const loopLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Sequence of commands to repeat in the loop. ' +
    'Each iteration will execute all commands in order.'),
  loop: z.number()
    .describe('Number of times to repeat the commands sequence. ' +
      'Positive number: Executes that many iterations. ' +
      'Negative number: Runs indefinitely until manually stopped. ' +
      'If the parent command is pausable, pressing the shortcut again will exit the loop.'),
})).describe('Allow to run same commands multiple time or in iteration or loop') as any as ZodType<{ commands: UnkownCommand[], loop: number }>;  // z.lazy requires manual type definition cause of reqursive type

const threadsLocalCommandSchema = z.lazy(() => z.object({
  threads: z.array(threadLocalArraySchema)
    .describe('List of command sequences to run in parallel threads. Each array element represents a separate thread. ' +
      'Commands within each thread run sequentially, while different threads execute simultaneously. ' +
      'This is useful for coordinating multiple independent actions or optimizing execution time.'),
})).describe('Allows to execute commands in parallel. Or in threads.') as ZodType<{ threads: UnkownCommand[][] }>;  // z.lazy requires manual type definition cause of reqursive type

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
  .describe('A macro that can be injected instead of command. That will run commands from its body. Can be also injected with variables.' +
    ' Think of it like a function');

const macrosListSchema = z.record(macroDefinitionSchema)
  .optional()
  .describe('A map of macros where a key is the macro name and value is its body');

type ExpressionLocalCommand = z.infer<typeof expressionLocalCommandSchema>;
type MacroLocalCommand = z.infer<typeof macroLocalCommandSchema>
type TransactionLocalCommand = z.infer<typeof transactionLocalCommandSchema>
type ThreadsLocalCommand = z.infer<typeof threadsLocalCommandSchema>
type LoopLocalCommand = z.infer<typeof loopLocalCommandSchema>
type ThreadLocalArray = z.infer<typeof threadLocalArraySchema>
type MacroList = z.infer<typeof macrosListSchema>
type VariablesDefinition = z.infer<typeof macroVariablesDescriptionSchema>
type UnkownCommand = RemoteCommand
  | MacroLocalCommand
  | ExpressionLocalCommand
  | TransactionLocalCommand
  | ThreadsLocalCommand
  | LoopLocalCommand;

export {
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
};

export type {
  LoopLocalCommand,
  ThreadLocalArray,
  ThreadsLocalCommand,
  MacroLocalCommand,
  TransactionLocalCommand,
  ExpressionLocalCommand,
  VariablesDefinition,
  UnkownCommand,
  MacroList,
};
