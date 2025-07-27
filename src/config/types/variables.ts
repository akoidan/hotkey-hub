import {z} from 'zod';

const variablesSchema = z.record(z.any())
  .describe('Object containing variable definitions that can be referenced throughout the configuration. ' +
  'Values can be any type, but numeric strings will be automatically converted to integers using parseInt. ' +
  'These variables can be referenced using {{variableName}} syntax in supported fields.');

const variableRegex = /\{\{\w+\}\}/u;

function extractVariableName(variable: unknown): string|undefined {
  if (typeof variable === 'string' && variableRegex.test(variable)) {
    return variable.substring(2, variable.length -2);
  }
  return undefined;
}

const variableValueSchema = z.string().regex(variableRegex)
  .describe('Reference to a variable using double curly brace syntax: {{variableName}}. ' +
    'The value will be replaced at runtime with either:\n' +
    '1. A matching variable from variables.json\n' +
    '2. A matching environment variable\n' +
    '3. A variable created during execution (e.g., from assignId or expression commands)');

type Variables = z.infer<typeof variablesSchema>

export {variablesSchema, variableValueSchema, variableRegex, extractVariableName};

export type {Variables};
