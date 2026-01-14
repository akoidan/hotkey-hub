import {z, type ZodType} from 'zod';
import type {UnknownCommand} from '@/config/types/commands';
import {unknownCommandSchema} from '@/config/types/commands';

enum ShufflePolicy {
  random = 'random',
  reverse = 'reverse',
  straight = 'straight',
}

const shufflePolicySchema = z.nativeEnum(ShufflePolicy)
  .describe('Random = shuffle array so it takes next element randomly.' +
    ' Reverse = each time it changes the order from first to last, then from last to first.' +
    ' Straight = Default order from first to last');

const shuffleLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema).describe('Sequence of commands to repeat in the loop. ' +
    'Each iteration will execute all commands in order.'),
  shuffle: shufflePolicySchema,
  // z.lazy requires manual type definition cause of reqursive type
}).strict()).describe(
  'Allow to run same commands in specific order'
) as any as ZodType<{ commands: UnknownCommand[], shuffle: ShufflePolicy }>;

type ShuffleLocalCommand = z.infer<typeof shuffleLocalCommandSchema>;

export {
  shufflePolicySchema,
  shuffleLocalCommandSchema,
  ShufflePolicy,
};

export type {
  ShuffleLocalCommand,
};
