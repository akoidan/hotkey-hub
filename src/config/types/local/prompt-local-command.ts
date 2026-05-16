import {z} from 'zod';

const choiceSchema = z.object({
  title: z.string()
    .describe('Display text shown to the user.'),
  value: z.union([z.string(), z.number(), z.boolean()]).optional()
    .describe('Value returned when this choice is selected. Defaults to its index in the array.'),
  description: z.string().optional()
    .describe('Optional hint/description shown when this choice is highlighted.'),
  disabled: z.boolean().optional()
    .describe('Disables selection of this choice.'),
  selected: z.boolean().optional()
    .describe('Pre-selects this choice (multiselect only).'),
}).describe('A single selectable option for select, multiselect, and autocomplete prompts.');

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
  ]).describe('Type of prompt to display.'),
  name: z.string()
    .describe('Key under which the answer is stored in the returned response object.'),
  message: z.string().optional()
    .describe('Prompt message displayed to the user.'),
  initial: z.union([z.string(), z.number(), z.boolean()]).optional()
    .describe('Default value pre-filled when the prompt opens.'),
  // text / number / password / invisible
  style: z.enum(['default', 'password', 'invisible', 'emoji']).optional()
    .describe('Render style for text input. "password" masks input, "invisible" hides it like sudo. Defaults to "default".'),
  // number
  min: z.number().optional()
    .describe('Minimum allowed value (number prompt).'),
  max: z.number().optional()
    .describe('Maximum allowed value (number prompt).'),
  float: z.boolean().optional()
    .describe('Allow floating point input (number prompt). Defaults to false.'),
  round: z.number().optional()
    .describe('Round float values to this many decimal places (number prompt). Defaults to 2.'),
  increment: z.number().optional()
    .describe('Step size when using arrow keys (number prompt). Defaults to 1.'),
  // list
  separator: z.string().optional()
    .describe('String used to split input into an array (list prompt). Defaults to ",".'),
  // toggle
  active: z.string().optional()
    .describe('Label for the active/on state (toggle prompt). Defaults to "on".'),
  inactive: z.string().optional()
    .describe('Label for the inactive/off state (toggle prompt). Defaults to "off".'),
  // select / multiselect / autocomplete
  choices: z.array(choiceSchema).optional()
    .describe('Array of choices for select, multiselect, and autocomplete prompts.'),
  hint: z.string().optional()
    .describe('Hint text displayed to the user below the prompt.'),
  warn: z.string().optional()
    .describe('Message shown when a disabled choice is selected.'),
  // multiselect
  instructions: z.union([z.string(), z.boolean()]).optional()
    .describe('Instruction text shown above choices. Set to false to hide (multiselect).'),
  optionsPerPage: z.number().optional()
    .describe('Number of choices visible at once (multiselect). Defaults to 10.'),
  // autocomplete
  limit: z.number().optional()
    .describe('Maximum number of autocomplete results to show. Defaults to 10.'),
  clearFirst: z.boolean().optional()
    .describe('First Escape keypress clears the input instead of exiting (autocomplete).'),
  fallback: z.string().optional()
    .describe('Message shown when no autocomplete match is found. Defaults to the initial value.'),
  // date
  mask: z.string().optional()
    .describe('Format mask for date input, e.g. "YYYY-MM-DD HH:mm:ss".'),
  // omitted: validate, format, onState, onRender, suggest, stdin, stdout
}).describe('Prompt question configuration. Check https://github.com/terkelg/prompts for more info ');

const promptLocalCommandSchema = z.object({
  prompt: promptQuestionSchema,
  assignVariable: z.string().describe('Assign result to a variable.'),
}).strict().describe('Prompts the user in the CLI of this app for input and assigns the result to a variable.');

type PromptLocalCommand = z.infer<typeof promptLocalCommandSchema>;

export {
  promptLocalCommandSchema,
  promptQuestionSchema,
  choiceSchema,
};

export type {
  PromptLocalCommand,
};