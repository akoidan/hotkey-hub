/* eslint-disable max-lines, @typescript-eslint/no-use-before-define */
import {z} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {type VariableValue, variableValueSchema} from '@/config/types/variables';
import {delayCommandsSchema} from '@/config/types/remote/base-remote-command';
import {unknownCommandSchema} from '@/config/types/commands';

const macroCallLocalCommandVariablesSchema = z.record(
  z.string(),
  z.union([z.any(), variableValueSchema])
).optional().describe(
  'Variables to pass to the macro. Object where keys are variable names and values are their values. ' +
  'Values must match the JSON Schema defined in the macro\'s variables section.'
);

const macroCallLocalCommandSchema = z.object({
  macro: z.string().describe('Name of the macro to execute, which must match a key defined in the macros section. ' +
    'Macros help reduce configuration repetition by reusing command sequences.').superRefine((macroName, ctx) => {
    const macroList = new Set(Object.keys(schemaRootCache.data.macros ?? {}));

    if (!macroList.has(macroName)) {
      const allOptions = JSON.stringify(Array.from(macroList));
      ctx.addIssue({
        code: 'custom',
        message: `Macro "${JSON.stringify(macroName)}" doesn't exist, available macros are ${allOptions}`,
      });
    }
  }),
  variables: macroCallLocalCommandVariablesSchema,
})
  .strict()
  .merge(delayCommandsSchema)
  .superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = schemaRootCache.data.macros ?? {};
    if (!definedMacros[command.macro] || !command.variables) {
      return;
    }
    for (const [key, value] of Object.entries(command.variables!)) {
      if (!definedMacros[command.macro]?.variables?.[key]) {
        ctx.addIssue({
          code: 'custom',
          path: ['variables'],
          message: `Passed variable ${JSON.stringify(key)}=${JSON.stringify(value)} doesn't have a description on macro`,
        });
      }
    }
    // eslint-disable-next-line max-lines-per-function
  }).superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = schemaRootCache.data.macros ?? {};
    if (!definedMacros[command.macro] || !command.variables) {
      return;
    }
    const variables = definedMacros[command.macro]?.variables;
    if (!variables) {
      return;
    }
    const requiredVariables = definedMacros[command.macro]?.requiredVariables;
    for (const [key, value] of Object.entries(variables)) {
      let isVariable = false;
      if ((command.variables?.[key] as VariableValue)?.$ref) {
        isVariable = true;
      }

      const schema = value as JsonSchema;

      if (command.variables?.[key] && !isVariable) {
        const variableValue: unknown = command.variables[key];
        const hasIssue = !schemaRootCache.getSchema(schema)(variableValue);
        if (hasIssue) {
          ctx.addIssue({
            code: 'custom',
            path: ['variables'],
            message: `Type mismatch for variable ${key}. ` +
              `Expected JSON Schema: ${JSON.stringify(schema)}, ` +
              `got value: ${JSON.stringify(variableValue)}`,
          });
        }
      }
      if (requiredVariables?.includes(key) && !command.variables?.[key]) {
        ctx.addIssue({
          code: 'custom',
          path: ['variables'],
          message: `macro ${command.macro} requires variable ${key} but only ${JSON.stringify(command.variables)} were passed. ` +
            'If this variable is optional, add "x-optional": true or set a "default" value in its schema.',
        });
      }
    }
  }).describe('Executes a predefined macro, which is a reusable sequence of commands. ' +
    'Similar to a function call, macros can accept parameters through variables. ' +
    'This helps avoid duplicating complex command sequences and makes configurations more maintainable.');

const macroDefinitionVariableValueSchema = z.record(z.string(), z.any())
  .superRefine((schema, ctx) => {
    if ('optional' in schema) {
      ctx.addIssue({
        code: 'custom',
        message: '"optional" is not supported. Use "x-optional": true or add a "default" value.',
      });
      return;
    }
    try {
      schemaRootCache.getSchema(schema);
    } catch (e: unknown) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid JSON Schema: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  })
  .describe(
    'JSON Schema for the variable value. ' +
    'Supports standard JSON Schema: {"type": "string"}, {"type": "number"}, ' +
    '{"type": "object", "properties": {...}}, {"type": "array", "items": {...}}, ' +
    '{"anyOf": [...]}, {} (any value). ' +
    'Use "default" to provide a default value (also marks the variable as optional). ' +
    'Use "x-optional": true to mark as optional without a default value.'
  );

const macroDefinitionVariablesDescriptionSchema = z.record(z.string(), macroDefinitionVariableValueSchema)
  .optional()
  .describe('Set of variable JSON Schema descriptors for macro');

const macroDefinitionSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Set of commands for this macro'),
  variables: macroDefinitionVariablesDescriptionSchema,
  requiredVariables: z.array(z.string()).default([]).optional().describe('List of required variables'),
}).strict())
  .describe('A reusable command sequence that can accept variables. Similar to a function that runs a predefined set of commands.');

const macrosListSchema = z.record(z.string(), macroDefinitionSchema)
  .optional()
  .describe('A map of macros where a key is the macro name and value is its body');

type MacroLocalCommand = z.infer<typeof macroCallLocalCommandSchema>
type MacroList = z.infer<typeof macrosListSchema>
type VariablesDefinition = z.infer<typeof macroDefinitionVariablesDescriptionSchema>
type JsonSchema = Record<string, any>;

export type {
  JsonSchema,
  VariablesDefinition,
  MacroLocalCommand,
  MacroList,
};

export {
  macroCallLocalCommandSchema,
  macroCallLocalCommandVariablesSchema,
  macroDefinitionVariableValueSchema,
  macroDefinitionVariablesDescriptionSchema,
  macroDefinitionSchema,
  macrosListSchema,
};