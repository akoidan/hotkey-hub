import {z, ZodIssueCode} from 'zod';
import {unknownCommandSchema} from '@/config/types/local-commands';

/* eslint-disable array-element-newline */
const allowedKeys = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10',
  'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24',
  'backspace', 'delete', 'return', 'enter', 'tab', 'escape',
  'space', 'insert', 'print_screen', 'home', 'end', 'page_up', 'page_down',
  'up', 'down', 'left', 'right',
  'caps_lock', 'num_lock', 'scroll_lock',
  'add', 'subtract', 'multiply', 'divide', 'clear',
  'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4',
  'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal',
  ',', '.', '/', ';', '\'', '[', ']', '\\', '-', '=', '`',
  'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop',
  'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind',
  'audio_forward', 'audio_repeat', 'audio_random',
  'lights_mon_up', 'lights_mon_down',
  'lights_kbd_toggle', 'lights_kbd_up', 'lights_kbd_down',
  'menu', 'pause',
];
const modifierKeys = [
  'control', 'right_control',
  'alt', 'right_alt',
  'shift', 'right_shift',
  'meta', 'right_meta',
  'win', 'right_win',
  'cmd', 'right_cmd',
  'fn',
];

/* eslint-enable array-element-newline */

// Zod schema for shortcuts
const shortcut = z
  .string()
  .refine((value) => {
    const modifiers = value.toLowerCase().split('+');
    // Must have at least 2 parts: one modifier and one main key
    if (modifiers.length < 2 || modifiers.length > 4) {
      return false;
    }
    const mainKey = modifiers.pop();
    // Ensure modifiers are unique and valid
    if (new Set(modifiers).size !== modifiers.length) {
      return false;
    }
    if (!modifiers.every((mod) => modifierKeys.includes(mod))) {
      return false;
    }
    return allowedKeys.includes(mainKey!);
    // eslint-disable-next-line max-len
    }, `Shortcut requires format Modifier+Key. E.g. 'Alt+1'. Allowed modifiers: '${modifierKeys.join('\', \'')}'. Allowed keys: '${allowedKeys.join('\', \'')}'.`)
  .describe('A keyboard shortcut in the format Modifier+Key (e.g., Alt+1, Ctrl+Shift+A). ' +
    'Must include at least one modifier key and one regular key. ' +
    'Can have up to 3 modifier keys combined (e.g., Ctrl+Alt+Shift+S).');


const shortcutSchema = z.object({
  delayAfter: z.number().optional()
    .describe('Delay in milliseconds to wait after executing each command in this shortcut\'s command list. ' +
      'Useful for ensuring commands have time to complete.'),
  delayBefore: z.number().optional()
    .describe('Delay in milliseconds to wait before executing each command in this shortcut\'s command list. ' +
      'Useful for timing coordination between shortcuts.'),
  name: z.string().describe('Descriptive name for this shortcut binding. ' +
    'This name is displayed during startup and helps identify the shortcut\'s purpose.'),
  shortCut: shortcut,
  commands: z.array(unknownCommandSchema).describe('Ordered list of commands to execute when this shortcut is triggered. ' +
    'Commands are executed sequentially unless specified otherwise (e.g., in parallel threads).'),
  pausable: z.boolean().default(false).optional()
    .describe('If true, pressing the shortcut again while commands are running will cancel the execution. ' +
      'Useful for long-running command sequences that you might need to stop.'),
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

export type {
  Shortcut,
};

export {
  shortcutSchema,
  shortcutsSchema,
};
