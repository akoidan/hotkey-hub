import {
  z,
  ZodIssueCode, ZodType,
} from 'zod';
import {
  commandSchema,
} from '@/config/types/schema';
import {schemaRootCache} from '@/config/types/cache';
import {delayCommandsSchema} from '@/config/types/commands';
import {variableRegex} from '@/config/types/variables';

const runMacroCommandSchema = z.object({
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
  commandSchema,
  runMacroCommandSchema,
  evaluateVariableSchema,
  transactionSchema,
]).describe('A remote command or a macro name'));

const transactionSchema: ZodType<any> = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Set of commands for this transaction'),
  transaction: z.string().describe('Transaction name'),
}));

const macroVariablesDescriptionSchema = z.record(z.object({
  type: z.enum(['string', 'number']).describe('To validate the type, or cast from env variables'),
  optional: z.boolean().optional().describe('If set to true, the key is be removed is var is not passed'),
})
  .strict()
  .optional())
  .describe('Set of variables descriptors for macro');

const evaluateVariableSchema = z.object({
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

type EvaluateVariableCommand = z.infer<typeof evaluateVariableSchema>;
type MacroCommand = z.infer<typeof runMacroCommandSchema>
type TransactionCommand = z.infer<typeof transactionSchema>
type UnkownCommand = z.infer<typeof unknownCommandSchema>
type MacroList = z.infer<typeof macrosDefinitionSchema>
type VariablesDefinition = z.infer<typeof macroVariablesDescriptionSchema>

export {
  runMacroCommandSchema,
  unknownCommandSchema,
  evaluateVariableSchema,
  transactionSchema,
  macroVariablesDescriptionSchema,
  macroSchema,
  macrosDefinitionSchema,
};

export type {
  MacroCommand,
  TransactionCommand,
  EvaluateVariableCommand,
  VariablesDefinition,
  UnkownCommand,
  MacroList,
};
