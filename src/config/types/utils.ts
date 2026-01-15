import {z, type ZodObject} from 'zod';
import {variableValueSchema} from '@/config/types/variables';

function makeVariableUnion(schema: ZodObject<any>): ZodObject<any> {
  /* eslint-disable */
  const shape = schema._def.shape;
  const newShape = {} as any;
  for (const key in shape) {
    newShape[key] = z.union([shape[key], variableValueSchema]);
  }
  /* eslint-enable */
  return z.object(newShape).strict();
}
export {makeVariableUnion};