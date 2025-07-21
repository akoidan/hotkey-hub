import {
  z,
  ZodIssueCode, ZodType,
} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {variableRegex} from '@/config/types/variables';
import {delayCommandsSchema, remoteCommandSchema} from "@/config/types/remote-commands";

const macroLocalCommandSchema = z.object({
  macro: z.string().describe('Name of the macro (key from macros section object)'),
  variables: z.record(z.union([z.string(), z.number()])).optional().describe('Object of a key-values of variable name and value'),
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
    for (const [key, value] of Object.entries(definedMacros[command.macro]?.variables)) {
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
  }).describe('Runs a macro from the macros section.');

const unknownCommandSchema = z.lazy(() => z.union([
  remoteCommandSchema,
  macroLocalCommandSchema,
  expressionLocalCommandSchema,
  transactionLocalCommandSchema,
  threadsLocalCommandSchema,
]).describe('A remote command or a macro name'));

const transactionLocalCommandSchema: ZodType<any> = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Set of commands for this transaction'),
  transaction: z.string().describe('Transaction name'),
}));

const threadLocalCommandsSchema =z.array(unknownCommandSchema)
  .describe('List of commands for this thread');

const loopLocalCommandSchema: ZodType<any> = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Set of commands for this transaction'),
  loop: z.number()
  .optional()
  .describe('Repeat commands in this schema in loop intil this shortcut ' +
    'is pressed again or number of iteration is finished. pass -1 for infinity'),
}));


const threadsLocalCommandSchema: ZodType<any> = z.lazy(() => z.object({
  threads: z.array(threadLocalCommandsSchema)
    .describe('List of threads'),
}));

const macroVariablesDescriptionSchema = z.record(z.object({
  type: z.enum(['string', 'number']).describe('To validate the type, or cast from env variables'),
  optional: z.boolean().optional().describe('If set to true, the key is be removed is var is not passed'),
})
  .strict()
  .optional())
  .describe('Set of variables descriptors for macro');

const expressionLocalCommandSchema = z.object({
  assignVariable: z.string().describe('Variable name to assign to'),
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
}).strict().describe('Allows to create/assign a variable by expression. In this case you need to set "destination" property to a string "null"');


const macroSchema = z.object({
  commands: z.array(unknownCommandSchema).describe('Set of commands for this macro'),
  variables: macroVariablesDescriptionSchema,
})
  .strict()
  .describe('A macro that can be injected instead of command. That will run commands from its body. Can be also injected with variables.' +
    ' Think of it like a function');

const macrosDefinitionSchema = z.record(macroSchema)
  .optional()
  .describe('A map of macros where a key is the macro name and value is its body');

type ExpressionLocalCommand = z.infer<typeof expressionLocalCommandSchema>;
type MacroLocalCommand = z.infer<typeof macroLocalCommandSchema>
type TransactionLocalCommand = z.infer<typeof transactionLocalCommandSchema>
type ThreadsLocalCommand = z.infer<typeof threadsLocalCommandSchema>
type LoopLocalCOmmand = z.infer<typeof loopLocalCommandSchema>
type ThreadLocalCommand = z.infer<typeof threadLocalCommandsSchema>
type UnkownCommand = z.infer<typeof unknownCommandSchema>
type MacroList = z.infer<typeof macrosDefinitionSchema>
type VariablesDefinition = z.infer<typeof macroVariablesDescriptionSchema>

export {
  loopLocalCommandSchema,
  threadsLocalCommandSchema,
  macroLocalCommandSchema,
  unknownCommandSchema,
  expressionLocalCommandSchema,
  transactionLocalCommandSchema,
  macroVariablesDescriptionSchema,
  macroSchema,
  threadLocalCommandsSchema,
  macrosDefinitionSchema,
};

export type {
  LoopLocalCOmmand,
  ThreadLocalCommand,
  ThreadsLocalCommand,
  MacroLocalCommand,
  TransactionLocalCommand,
  ExpressionLocalCommand,
  VariablesDefinition,
  UnkownCommand,
  MacroList,
};
