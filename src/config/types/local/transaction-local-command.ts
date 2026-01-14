import {z, type ZodType} from 'zod';
import {variableValueSchema} from '@/config/types/variables';
import {unknownCommandSchema} from '@/config/types/local/local-commands';

const transactionLocalCommandSchema = z.lazy(() => z.object({
  commands: z.array(unknownCommandSchema)
    .describe('Commands to execute atomically in this transaction. All commands either succeed or fail together.'),
  transaction: z.union([variableValueSchema, z.string()])
    .describe('Unique name for the transaction. Helps with logging and debugging transaction execution.'),
}).strict()).describe('Run commands in a transaction.' +
  ' Prevents concurrent transactions with same name.' +
  ' Uses PC name for remote commands. Ensures atomic execution.') as any as ZodType<{ commands: UnknownCommand[], transaction: string }>;

type TransactionLocalCommand = z.infer<typeof transactionLocalCommandSchema>;

export {
  transactionLocalCommandSchema,
};

export type {
  TransactionLocalCommand,
};
