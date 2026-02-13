/* eslint-disable max-lines, @typescript-eslint/no-use-before-define */
import {z} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import {type VariableValue, variableValueSchema} from '@/config/types/variables';
import {delayCommandsSchema} from '@/config/types/remote/base-remote-command';
import {unknownCommandSchema} from '@/config/types/commands';


function validateType(val: any, type: VariableType): boolean {
  // Handle primitive types
  if (type === 'any') {
    return true;
  }
  if (val === undefined) {
    return false;
  }
  if (typeof type === 'string') {
    if (type.endsWith('[]')) {
      // Handle array type (e.g., 'string[]')
      if (!Array.isArray(val)) {return false;}
      const elementType = type.slice(0, -2) as PrimitiveVariableType;
      return val.every((item: any) => typeof item === elementType || elementType === 'any');
    }
    // Handle primitive type
    return typeof val === type || type === 'any';
  }

  // Handle object type
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    return false;
  }

  // Recursively validate object properties
  for (const [k, t] of Object.entries(type)) {
    if (!(k in val) || !validateType(val[k], t as VariableType)) {
      return false;
    }
  }
  return true;
}

const macroLocalCommandVariablesSchema = z.record(
  z.string(),
  z.union([z.any(), variableValueSchema])
).optional().describe(
  'Variables to pass to the macro. Object where keys are variable names and values are their values. ' +
  'Values can be strings or numbers and must match the types defined in the macro\'s variables section.'
);

const macroLocalCommandSchema = z.object({
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
  variables: macroLocalCommandVariablesSchema,
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
    for (const [key, value] of Object.entries(variables)) {
      let isVariable = false;
      if ((command.variables?.[key] as VariableValue)?.$ref) {
        isVariable = true;
      }

      if (command.variables?.[key] && !isVariable) {
        const variableValue: unknown = command.variables[key];
        const expectedType: VariableType = value!.type;
        if (!validateType(variableValue, expectedType)) {
          ctx.addIssue({
            code: 'custom',
            path: ['variables'],
            message: `Type mismatch for variable ${key}. ` +
              `Expected type: ${JSON.stringify(expectedType)}, ` +
              `got value: ${JSON.stringify(variableValue)}`,
          });
        }
      }
      if (!value!.optional && !command.variables?.[key]) {
        ctx.addIssue({
          code: 'custom',
          path: ['variables'],
          message: `macro ${command.macro} requires variable ${key} but only ${JSON.stringify(command.variables)} were passed`,
        });
      }
    }
  }).describe('Executes a predefined macro, which is a reusable sequence of commands. ' +
    'Similar to a function call, macros can accept parameters through variables. ' +
    'This helps avoid duplicating complex command sequences and makes configurations more maintainable.');


// First, define the primitive types
const macroPrimitiveVariableTypeSchema = z.union([
  z.literal('string'),
  z.literal('number'),
  z.literal('boolean'),
  z.literal('any'),
]);

// Then define the array type (recursive)
const macroArrayVariableTypeSchema: z.ZodType<ArrayVariableType> = z.lazy(() =>
  z.union([
    z.string().refine(s => s.endsWith('[]') && macroPrimitiveVariableTypeSchema.safeParse(s.slice(0, -2)).success, {
      message: 'Array type must be a primitive type followed by []',
    }),
    z.record(z.string(), macroVariableTypeSchema),
  ]));

// Then define the object type (recursive)
const macroObjectVariableTypeSchema: z.ZodType<ObjectVariableType> = z.lazy(() =>
  z.record(z.string(), macroVariableTypeSchema));

// Finally, combine them into one schema
const macroVariableTypeSchema = z.union([
  macroPrimitiveVariableTypeSchema,
  macroObjectVariableTypeSchema,
  macroArrayVariableTypeSchema,
]).describe('To validate the type, or cast from env variables');

// eslint-disable-next-line
interface VariableTypeMap {
  [key: string]: VariableType;
}
// TypeScript types for better type inference
type PrimitiveVariableType = 'string' | 'number' | 'boolean' | 'any';
type ArrayVariableType = string | VariableTypeMap;
type ObjectVariableType = VariableTypeMap;
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type VariableType = PrimitiveVariableType | ArrayVariableType | ObjectVariableType;

const macroVariableValueSchema = z.object({
  type: macroVariableTypeSchema,
  optional: z.boolean().optional().describe('If set to true, the key is be removed is var is not passed'),
  default: z.any().optional().describe('Default value if value is not passed. Optional should be set to true'),
})
  .strict()
  .refine(
    (v) => v.default === undefined || v.optional,
    {
      message: '`optional` must be true when `default` is provided',
      path: ['optional'],
    }
  ).describe('Variable description for macro');

const macroVariablesDescriptionSchema = z.record(z.string(), macroVariableValueSchema)
  .optional()
  .describe('Set of variables descriptors for macro');


const macroDefinitionSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Set of commands for this macro'),
  variables: macroVariablesDescriptionSchema,
}).strict())
  .describe('A reusable command sequence that can accept variables. Similar to a function that runs a predefined set of commands.');

const macrosListSchema = z.record(z.string(), macroDefinitionSchema)
  .optional()
  .describe('A map of macros where a key is the macro name and value is its body');

type MacroLocalCommand = z.infer<typeof macroLocalCommandSchema>
type MacroList = z.infer<typeof macrosListSchema>

type VariablesDefinition = z.infer<typeof macroVariablesDescriptionSchema>

export type {
  VariablesDefinition,
  MacroLocalCommand,
  MacroList,
};

export {
  macroLocalCommandVariablesSchema,
  macroPrimitiveVariableTypeSchema,
  macroArrayVariableTypeSchema,
  macroObjectVariableTypeSchema,
  macroVariableTypeSchema,
  macroLocalCommandSchema,
  macroVariableValueSchema,
  macroVariablesDescriptionSchema,
  macroDefinitionSchema,
  macrosListSchema,
};