import {baseDestinationSchema} from '@/config/types/remote/base-remote-command';
import {z} from 'zod';

// Base schema for all commands without variables
const baseGetInfoCommandSchema = baseDestinationSchema.extend({
  get: z.string().describe('Name of this command'),
  assignVariable: z.string().describe('Assign result to a variable'),
}).strict();

export {
  baseGetInfoCommandSchema,
};