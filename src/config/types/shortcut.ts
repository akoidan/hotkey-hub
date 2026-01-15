import {z, ZodIssueCode} from 'zod';
import {allowedKeys, modifierKeys} from '@/config/types/keyboard';
import {unknownCommandSchema} from '@/config/types/commands';

// Zod schema for shortcuts
const shortcut = z
  .string()
  .refine((value) => {
    const modifiers = value.toLowerCase().split('+');
    // Must have at least 2 parts: one modifier and one main key
    if (modifiers.length < 2 || modifiers.length > 4) {
      return false;
    }
    const mainKey = modifiers.pop() as KeyType;
    // Ensure modifiers are unique and valid
    if (new Set(modifiers).size !== modifiers.length) {
      return false;
    }
    // @ts-ignore
    if (!modifiers.every((mod) => modifierKeys.includes(mod))) {
      return false;
    }
    // @ts-ignore
    return allowedKeys.includes(mainKey!);
    // eslint-disable-next-line max-len
  }, 'Shortcut requires format Modifier+Key. E.g. \'Alt+1\'.'
    + `Allowed modifiers: '${modifierKeys.join('\', \'')}'. Allowed keys: '${allowedKeys.join('\', \'')}'.`)
  .describe('Keyboard shortcut format: Modifier+Key (e.g., Alt+1, Ctrl+Shift+A).' +
    ' Needs at least one modifier. Max 3 modifiers (e.g., Ctrl+Alt+Shift+S).');

enum BehaviourEnum {
  'stacking'= 'stacking',
  'pausable'= 'pausable',
  'restart'= 'restart',
}
const behaviourSchema = z.nativeEnum(BehaviourEnum)
  .describe('Stacking = Current process will keep running and new one will spawn as well.' +
  ' Since all executable items run in transaction by default.' +
  'The next iteration will wait until current is finished. The default behaviour\n' +
  'Pausable = Current process will stop running and new one won\'t start.\n' +
  'Restart = Current process will stop running and new one will start\n');

const behaviourObjectSchema = z.object({
  groupWith: z.string().optional()
    .describe('If type is "restart" or "pausable" then groupWith will restart/pause all shortcuts with the same name'),
  type: behaviourSchema,
}).strict();

const shortcutSchema = z.object({
  delayAfter: z.number().optional()
    .describe('Delay (ms) after each command. Ensures commands have time to complete.'),
  delayBefore: z.number().optional()
    .describe('Delay (ms) before each command. Helps coordinate timing between different shortcuts.'),
  name: z.string().describe('Name shown during startup. Helps identify the shortcut\'s purpose.'),
  shortCut: shortcut,
  commands: z.array(unknownCommandSchema).describe('Commands to run when shortcut triggered. ' +
    'Executes in order unless parallel execution specified.'),
  behaviour: z.union([behaviourSchema, behaviourObjectSchema])
    .default(BehaviourEnum.stacking)
    .optional()
    .describe('Controls the the behaviour of the process when you press again the shortcut ' +
      'and the old process is still running.'),
})
  .strict()
  .describe('This allows to bind a shortcut to a commands list and define execution behaviour.' +
    ' E.g. press `alt+1` on local PC to send a mouseClick on a remote one');

const shortcutsSchema = z.array(shortcutSchema)
  .superRefine((combinations, ctx) => {
    const shortCuts = new Map<string, number>();
    combinations.forEach((value, i) => {
      if (shortCuts.has(value.shortCut.toLowerCase())) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['shortcut', i],
          message: `Shortcut ${value.shortCut} already exists at index ${shortCuts.get(value.shortCut)}`,
        });
      }
      shortCuts.set(value.shortCut.toLowerCase(), i);
    });
  }).describe('Array of shortcut definitions that map keyboard combinations to command sequences. ' +
    'Each shortcut must have a unique key combination. ' +
    'This is the main configuration that defines what happens when specific keys are pressed.');

type Shortcut = z.infer<typeof shortcutSchema>;
type BehaviourObject = z.infer<typeof behaviourObjectSchema>;

export type {
  Shortcut,
  BehaviourObject,
};

export {
  shortcutSchema,
  BehaviourEnum,
  behaviourObjectSchema,
  behaviourSchema,
  shortcutsSchema,
};
