import {z, ZodAny, type ZodObject, type ZodTypeAny} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {ZodEffects, ZodOptionalDef} from 'zod/src/v3/types';


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
  /* eslint-disable */
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
export {makeVariableUnion};