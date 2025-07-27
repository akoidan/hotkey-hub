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
  .describe('A shorcut to be pressed. E.g. Alt+1');


const shortcutSchema = z.object({
  delayAfter: z.number().optional().describe('Delay in milliseconds after each command for this shorcut'),
  delayBefore: z.number().optional().describe('Delay in milliseconds before each command for this shorcut'),
  name: z.string().describe('Name that is printed during startup with a shorcut'),
  shortCut: shortcut,
  commands: z.array(unknownCommandSchema).describe('List of commands for this shortcut'),
  pausable: z.boolean().default(false).optional()
      .describe('If set to true pressing this shortcut again would be cancel current run'),
}).strict();

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
  }).describe('Shorcuts mappings. Main logic');

type Shortcut = z.infer<typeof shortcutSchema>;

export type {
  Shortcut,
};

export {
  shortcutSchema,
  shortcutsSchema,
};
