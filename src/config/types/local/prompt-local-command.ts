import {z} from 'zod';

const promptLocalCommandSchema = z.lazy(() => z.object({
  prompt: z.record(z.string(), z.any()),
  assignVariable: z.string().describe('Assign result to a variable.'),
}).strict()).describe('Conditional execution of commands based on a boolean condition. ' +
  'If the condition is true, executes the "then" commands, otherwise executes the "else" commands if they exist.');

type PromptLocalCommand = z.infer<typeof promptLocalCommandSchema>;

export {
  promptLocalCommandSchema,
};

export type {
  PromptLocalCommand,
};
