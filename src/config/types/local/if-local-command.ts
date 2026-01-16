import {z, type ZodType} from 'zod';
import {expressionSchema} from '@/config/types/local/expression-local-command';
import {type UnknownCommand, unknownCommandSchema} from '@/config/types/commands';

const ifLocalCommandSchema = z.lazy(() => z.object({
  if: expressionSchema,
  then: z.array(unknownCommandSchema)
    .describe('Commands to execute if the condition is true'),
  else: z.array(unknownCommandSchema)
    .optional()
    .describe('Optional commands to execute if the condition is false'),
}).strict()).describe('Conditional execution of commands based on a boolean condition. ' +
  'If the condition is true, executes the "then" commands, otherwise executes the "else" commands if they exist.') as any as ZodType<{
  if: string,
  then: UnknownCommand[],
  else?: UnknownCommand[]
}>;

type IfLocalCommand = z.infer<typeof ifLocalCommandSchema>;

export {
  ifLocalCommandSchema,
};

export type {
  IfLocalCommand,
};
