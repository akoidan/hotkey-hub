import {z} from 'zod';

const variablesSchema = z.record(z.any()).describe('if number, parseInt will be used');

const variableRegex = /\{\{\w+\}\}/u;

function extractVariableName(variable: unknown): string|undefined {
  if (typeof variable === 'string' && variableRegex.test(variable)) {
    return variable.substring(2, variable.length -2);
  }
  return undefined;
}

const variableValueSchema = z.string().regex(variableRegex)
  .describe('Pass a variable in curly braces to replace this value with a variable from an environment variable or variables.json file. Example of format: {{varName}}');

type Variables = z.infer<typeof variablesSchema>

export {variablesSchema, variableValueSchema, variableRegex, extractVariableName};

export type {Variables};
