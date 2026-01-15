import {z, type ZodObject, type ZodTypeAny} from 'zod';

const variablesSchema = z.record(z.string(), z.any())
  .describe('Variable definitions for configuration.' +
    ' Values can be any type (numeric strings auto-convert to integers). Use {{varName}} to reference.');

const variableRegex = /(?<variable>[a-zA-Z_$][\w$]*)(?:\[[^\]]+\]|\.[a-zA-Z_$][\w$]*)*/u;

/* eslint-disable */
// horrible code ;(
function unpack(inner: any, options: any) {
  if (inner.description) {
    options.description = inner.description;
  }
  if (inner.type === 'default') {
    options.defaultValue = inner.def.defaultValue;
    return unpack(inner.def.innerType, options);
  }
  if (inner.type === 'optional') {
    options.optional = true;
    return unpack(inner.def.innerType, options);
  }
  if (inner.type === 'union') {
    options.union = true;
    return inner;
  }
  if (inner.type == 'number') {
    return inner;
  }
  throw new Error('Unknown type: ' + inner.type);
}

function makeVariableUnion(schema: ZodObject<Record<string, ZodTypeAny>>): ZodObject<Record<string, ZodTypeAny>> {
  const shape = schema._def.shape as Record<string, ZodTypeAny>;
  const newShape = {} as Record<string, ZodTypeAny>;
  for (const key in shape) {
    let inner: any = shape[key];


    const options: any = {};
    inner = unpack(inner, options)
    let union: any = z.union([inner, variableValueSchema]);
    if (options.defaultValue !== undefined) {
      union = union.default(options.defaultValue);
    }
    if (options.optional) {
      union = union.optional();
    }
    if (options.description) {
      union = union.describe(options.description);
    }
    newShape[key] = union;
  }
  /* eslint-enable */
  return z.object(newShape).strict();
}
/* eslint-enable */

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

export {variablesSchema, variableValueSchema, variableRegex, makeVariableUnion};

export type {Variables, VariableValue};
