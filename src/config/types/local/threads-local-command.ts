import {z, type ZodType} from 'zod';
import {unknownCommandSchema} from '@/config/types/local/local-commands';

const threadLocalArraySchema = z.object({
  name: z.string().max(10).nonempty().describe('name of the thread, required for req-id log, '),
  commands: z.array(unknownCommandSchema).describe('list of commands in this thread'),
}).describe('List of commands to execute in a single thread.' +
  ' Commands run sequentially in their thread, while threads run in parallel.') as any as ZodType<Thread>;  // z.lazy requires manual type definition cause of reqursive type

const threadsLocalCommandSchema = z.lazy(() => z.object({
  threads: z.array(threadLocalArraySchema).describe('Command sequences to run in parallel.' +
    ' Each thread runs sequentially while threads run simultaneously.'),
  // z.lazy requires manual type definition cause of reqursive type
}).strict()).describe('Allows to execute commands in parallel. Or in threads.') as ZodType<{ threads: Thread[] }>;

interface Thread {
  name: string,
  commands: UnknownCommand[]
}

type ThreadsLocalCommand = z.infer<typeof threadsLocalCommandSchema>;

export {
  threadLocalArraySchema,
  threadsLocalCommandSchema,
};

export type {
  Thread,
  ThreadsLocalCommand,
};
