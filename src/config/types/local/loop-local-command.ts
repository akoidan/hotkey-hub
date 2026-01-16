import {z, type ZodType} from 'zod';
import {expressionSchema} from '@/config/types/local/expression-local-command';
import {type UnknownCommand, unknownCommandSchema} from '@/config/types/commands';

const loopLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Sequence of commands to repeat in the loop. ' +
    'Each iteration will execute all commands in order.'),
  loop: z.union([z.number(), expressionSchema])
    .describe('Number of times to repeat the commands sequence. ' +
      'Positive number: Executes that many iterations. ' +
      'Negative number: Runs indefinitely until manually stopped. ' +
      'If the parent command is pausable, pressing the shortcut again will exit the loop.' +
      'If string is passed evaluated that string as expresssion and repeat the loop while it\'s true'),
  // z.lazy requires manual type definition cause of reqursive type
}).strict()).describe(
  'Allow to run same commands multiple time or in iteration or loop'
) as any as ZodType<{ commands: UnknownCommand[], loop: number | string }>;

type LoopLocalCommand = z.infer<typeof loopLocalCommandSchema>;

export {
  loopLocalCommandSchema,
};

export type {
  LoopLocalCommand,
};
