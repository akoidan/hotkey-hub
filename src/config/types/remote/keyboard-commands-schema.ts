import {z} from 'zod';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';
import {allowedKeys, modifierKeys} from '@/config/types/keyboard';
import {makeVariableUnion} from '@/config/types/variables';

const keySchema =  z.enum([
  ...allowedKeys,
  ...modifierKeys,
]).describe('One of the keyboard keys.');

const keyPressRemoteVariableSchema = z.object({
  key: z.union([keySchema, z.array(keySchema)])
    .describe('Key(s) to press. Can be a single key or array of keys for multiple presses.'),
  duration: z.number().min(50).optional()
    .describe('How long to hold the key down in milliseconds. Recommended minimum 50ms to ensure reliable key registration.'),
  durationDeviation: z.number().min(0).default(0).optional()
    .describe('Adds randomness to key press duration. Value is the maximum +/- deviation in milliseconds. ' +
      'Useful for simulating human-like input patterns.'),
  holdKeys: z.union([keySchema, z.array(keySchema)])
    .optional()
    .describe('Modifier keys to hold (e.g., Alt for Alt+1, Ctrl+Shift for Ctrl+Shift+A). Can be a key or key array.'),
});

// copied from https://github.com/akoidan/http-remote-pc-control/blob/main/src/keyboard/keyboard-layout-dto.ts
/* eslint-disable array-element-newline */
const keyboardLayoutValueSchema = z.enum([
  // Latin-based layouts
  'us', 'en', 'gb', 'au', 'nz', 'ie', 'za',
  'de', 'at', 'ch', 'li',
  'fr', 'be', 'lu', 'mc',
  'es', 'mx', 'cl', 've', 'pe', 'ec', 'uy', 'py', 'bo',
  'it', 'sm', 'va',
  'pt',
  'nl', 'sr',
  'no', 'dk', 'fi', 'is',
  'pl', 'cz', 'sk', 'hu', 'hr', 'ba', 'rs', 'me', 'mk', 'bg',
  'ro', 'md',
  'ee', 'lv', 'lt',
  'mt',
  'tr', 'az',

  // Cyrillic-based layouts
  'ru', 'by', 'ua', 'kz', 'kg', 'tj', 'uz', 'tm', 'mn',

  // Greek
  'gr',

  // Arabic-based layouts
  'ar', 'ae', 'bh', 'dz', 'eg', 'iq', 'jo', 'kw', 'ly', 'ma', 'om', 'qa', 'sa', 'sy', 'tn', 'ye',
  'fa', 'ir',
  'ur', 'pk',

  // Hebrew
  'il', 'he',

  // Asian layouts
  'cn', 'zh', 'tw', 'hk', 'mo',
  'jp', 'ja',
  'kr', 'ko',
  'th',
  'vn', 'vi',
  'kh', 'km',
  'lo',
  'my', 'ms',
  'id',
  'ph', 'tl',
  'sg',
  'bn', 'bd',
  'hi', 'in', 'ta', 'te', 'ml', 'kn', 'gu', 'or', 'pa', 'as', 'ne',
  'si', 'lk',
  'mm',

  // African layouts
  'am', 'et',
  'sw', 'ke', 'tz',
  'zu', 'xh', 'af',
  'ha', 'ng',
  'sn', 'bf', 'ci', 'gn', 'td', 'cf', 'cm', 'cg', 'cd', 'mg', 'dj',

  // Other layouts
  'eo', // Esperanto
  'la', // Latin
  'eu', // Basque
  'ca', // Catalan
  'gl', // Galician
  'cy', // Welsh
  'ga', // Irish
  'gd', // Scottish Gaelic
  'br', // Breton
  'oc', // Occitan
  'co', // Corsican
  'sc', // Sardinian
  'fur', // Friulian
  'rm', // Romansh
  'lb', // Luxembourgish
  'fo', // Faroese
  'kl', // Greenlandic
  'se', // Northern Sami
  'smj', // Lule Sami
  'sma', // Southern Sami
  'smn', // Inari Sami
  'sms', // Skolt Sami
]).describe('Keyboard layout');
/* eslint-enable array-element-newline */

const keyboardLayoutVariableSchema = z.object({
  layout: keyboardLayoutValueSchema,
});

const keyPressRemoteCommandVariableSchema = makeVariableUnion(keyPressRemoteVariableSchema);
const keyboardLayoutCommandVariableSchema = makeVariableUnion(keyboardLayoutVariableSchema);

const keyPressRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('keyPress'),
  variables: keyPressRemoteCommandVariableSchema,
}).strict().describe('Simulates keyboard input on the remote PC by sending key press events. ' +
  'Supports single keys, key combinations, and modifier keys with customizable timing and randomness. ' +
  'Use this for automating keyboard input or triggering keyboard shortcuts.');

const setKeyboardLayoutRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('setKeyboardLayout'),
  variables: keyboardLayoutCommandVariableSchema,
}).strict().describe('Simulates keyboard input on the remote PC by sending key press events. ' +
    'Supports single keys, key combinations, and modifier keys with customizable timing and randomness. ' +
    'Use this for automating keyboard input or triggering keyboard shortcuts.');

const typeTextRemoteVariableSchema = z.object({
  text: z.string()
    .describe('Any string to type'),
  keyDelay: z.number()
    .default(100)
    .optional()
    .describe('Delay between keystroke in milliseconds. By default types as fast as possible, around 40ms per char'),
  keyDelayDeviation: z.number()
    .positive()
    .default(0.1)
    .optional()
    .describe('Deviation for randomness of delay. E.g if keyDelay = 100 and deviation = 0.2. Then value would be 80-120ms'),
}).strict();

const typeTextRemoteCommandVariableSchema = makeVariableUnion(typeTextRemoteVariableSchema);

const typeTextRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('typeText'),
  variables: typeTextRemoteCommandVariableSchema,
}).strict().describe('Types text on the remote PC.');

const keyboardCommandsSchema = z.union([
  keyPressRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  setKeyboardLayoutRemoteCommandSchema,
]).describe('Keyboard-related remote commands');

type TypeTextRemoteVariable = z.infer<typeof typeTextRemoteVariableSchema>
type TypeTextRemoteCommand = z.infer<typeof typeTextRemoteCommandSchema>
type KeyPressRemoteCommand = z.infer<typeof keyPressRemoteCommandSchema>
type KeyPressRemoteVariable = z.infer<typeof keyPressRemoteVariableSchema>
type SetKeyboardLayoutRemoteCommand = z.infer<typeof setKeyboardLayoutRemoteCommandSchema>


type Key = z.infer<typeof keySchema>;

export type {
  SetKeyboardLayoutRemoteCommand,
  TypeTextRemoteVariable,
  KeyPressRemoteVariable,
  TypeTextRemoteCommand,
  KeyPressRemoteCommand,
  Key,
};

export {
  setKeyboardLayoutRemoteCommandSchema,
  keyboardLayoutCommandVariableSchema,
  keySchema,
  keyPressRemoteCommandVariableSchema,
  typeTextRemoteCommandVariableSchema,
  keyPressRemoteVariableSchema,
  typeTextRemoteVariableSchema,
  keyPressRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  keyboardCommandsSchema,
};