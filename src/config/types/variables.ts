import {z} from 'zod';

const variablesSchema = z.record(z.any())
  .describe('Variable definitions for configuration.' +
    ' Values can be any type (numeric strings auto-convert to integers). Use {{varName}} to reference.');

const variableRegex = /\{\{\s*(?<variable>[a-zA-Z_$][\w$]*)(?:\[[^\]]+\]|\.[a-zA-Z_$][\w$]*)*\s*\}\}/u;

const variableValueSchema = z.string().regex(variableRegex)
  .describe('Reference to a variable using double curly brace syntax: {{variableName}}. ' +
    'The value will be replaced at runtime with either:\n' +
    '1. A matching variable from variables.json\n' +
    '2. A matching environment variable\n' +
    '3. A variable created during execution (e.g., from assignId or expression commands)');

type Variables = z.infer<typeof variablesSchema>

export {variablesSchema, variableValueSchema, variableRegex};

export type {Variables};
