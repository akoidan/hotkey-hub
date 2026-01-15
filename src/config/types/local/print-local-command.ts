import {z} from 'zod';
import {expressionSchema} from '@/config/types/local/expression-local-command';

console.log('print-local-command.ts: expressionSchema', !!expressionSchema);
const printLocalCommandSchema = z.object({
  print: expressionSchema,
  // z.lazy requires manual type definition cause of reqursive type
})
  .strict()
  .describe(
    'Print the expressions to log'
  );

type PrintLocalCommand = z.infer<typeof printLocalCommandSchema>;

export {
  printLocalCommandSchema,
};

export type {
  PrintLocalCommand,
};
