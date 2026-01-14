import {z, ZodObject} from 'zod';
import {keySchema, variableValueSchema} from '@/config/types/remote-commands';

function makeVariableUnion(schema: ZodObject<any>): ZodObject<any> {
  const shape = schema._def.shape();
  const newShape = {} as any;
  for (const key in shape) {
    newShape[key] = z.union([shape[key], variableValueSchema]);
  }
  return z.object(newShape).strict();
}
export {makeVariableUnion};