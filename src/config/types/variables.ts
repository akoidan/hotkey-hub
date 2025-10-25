import {z} from 'zod';

const variablesSchema = z.record(z.any())
  .describe('Variable definitions for configuration.' +
    ' Values can be any type (numeric strings auto-convert to integers). Use {{varName}} to reference.');


const variableRegex = /(?<variable>[a-zA-Z_$][\w$]*)(?:\[[^\]]+\]|\.[a-zA-Z_$][\w$]*)/u;

const variableValueSchema = z.object({
  $ref: z.string(),
})
  .describe('Reference to a variable from a variables definition section. ' +
    'The value will be replaced at runtime with either:\n' +
    '1. A matching variable from variables.json\n' +
    '2. A matching environment variable\n' +
    '3. A variable created during execution (e.g., from assignId or expression commands)');

type Variables = z.infer<typeof variablesSchema>
type VariableValue = z.infer<typeof variableValueSchema>

export {variablesSchema, variableValueSchema, variableRegex};

export type {Variables, VariableValue};
