import {baseDestinationSchema} from '@/config/types/remote/base-remote-command';
import {z} from 'zod';

// Base schema for all commands without variables
const baseGetInfoCommandSchema = baseDestinationSchema.extend({
  get: z.string().describe('Name of this command'),
  assignVariable: z.union(
    [z.array(z.string()), z.string()]
  ).describe('Assign result to a variable. ' +
    'If array is passsed then the result is gonna be destruted into corresponding variable.' +
    ' E.g. if result is [1,2] and assignVariable = ["a","b"], then a = 1, b = 2. If array length missmatch, an exception is thrown'),
}).strict();

export {
  baseGetInfoCommandSchema,
};