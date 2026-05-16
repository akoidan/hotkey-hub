import {z} from 'zod';

const choiceSchema = z.object({
  title: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().optional(),
  disabled: z.boolean().optional(),
  selected: z.boolean().optional(),
});

const promptQuestionSchema = z.object({
  type: z.enum([
    'text',
    'password',
    'invisible',
    'number',
    'confirm',
    'list',
    'toggle',
    'select',
    'multiselect',
    'autocomplete',
    'date',
    'autocompleteMultiselect',
  ]),
  name: z.string(),
  message: z.string().optional(),
  initial: z.union([z.string(), z.number(), z.boolean()]).optional(),
  // text / number / password / invisible
  style: z.enum(['default', 'password', 'invisible', 'emoji']).optional(),
  // number
  min: z.number().optional(),
  max: z.number().optional(),
  float: z.boolean().optional(),
  round: z.number().optional(),
  increment: z.number().optional(),
  // list
  separator: z.string().optional(),
  // toggle
  active: z.string().optional(),
  inactive: z.string().optional(),
  // select / multiselect / autocomplete
  choices: z.array(choiceSchema).optional(),
  hint: z.string().optional(),
  warn: z.string().optional(),
  // multiselect
  instructions: z.union([z.string(), z.boolean()]).optional(),
  optionsPerPage: z.number().optional(),
  // autocomplete
  limit: z.number().optional(),
  clearFirst: z.boolean().optional(),
  fallback: z.string().optional(),
  // date
  mask: z.string().optional(),
  // omitted: validate, format, onState, onRender, suggest, stdin, stdout
});

const promptLocalCommandSchema = z.object({
  prompt: promptQuestionSchema,
  assignVariable: z.string().describe('Assign result to a variable.'),
}).strict().describe('Prompts the user for input and assigns the result to a variable.');

type PromptLocalCommand = z.infer<typeof promptLocalCommandSchema>;

export {
  promptLocalCommandSchema,
  promptQuestionSchema,
  choiceSchema,
};

export type {
  PromptLocalCommand,
};