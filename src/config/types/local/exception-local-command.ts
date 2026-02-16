import {z, type ZodType} from 'zod';
import {type UnknownCommand, unknownCommandSchema} from '@/config/types/commands';

const exceptionLocalCommandSchema = z.lazy(() => z.object({
  try: z.array(unknownCommandSchema)
    .describe('Commands to execute if the condition is true'),
  catch: z.array(unknownCommandSchema)
    .optional()
    .describe('Execute this commands on catch block. If catch is omited, commands in the try block will fail silently'),
  finally: z.array(unknownCommandSchema)
    .optional()
    .describe('Execute this command after try block, whether it fails/succeed'),
}).strict()).describe('Allows to execute statements in try block and fail silently' +
  ' by keeping next commands after this command executing') as any as ZodType<{
  try: UnknownCommand[],
  catch?: UnknownCommand[],
  finally?: UnknownCommand[]
}>;

type ExceptionLocalCommand = z.infer<typeof exceptionLocalCommandSchema>;

export {
  exceptionLocalCommandSchema,
};

export type {
  ExceptionLocalCommand,
};
