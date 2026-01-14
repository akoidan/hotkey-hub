import {z} from 'zod';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';
import {makeVariableUnion} from '@/config/types/utils';
import {variableValueSchema} from '@/config/types/variables';

const keySchema = z.enum([
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
  't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10',
  'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3',
  'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space',
  'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd',
  'menu', 'fn', 'shift', 'command', 'right_shift', 'command', '`', '-', '=', 'backspace', '[', ']', '\\', ';',
  '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end',
  'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'enter', 'caps_lock', 'scroll_lock', 'num_lock',
  'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev',
  'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random'
  ]).describe('One of the keyboard keys.');

const keyPressRemoteVariableSchema = z.object({
  key: z.union([keySchema, z.array(keySchema)])
    .describe('Key(s) to press. Can be a single key or array of keys for multiple presses.'),
  duration: z.number().min(50).optional()
    .describe('How long to hold the key down in milliseconds. Minimum 50ms to ensure reliable key registration.'),
  durationDeviation: z.number().min(0).default(0).optional()
    .describe('Adds randomness to key press duration. Value is the maximum +/- deviation in milliseconds. ' +
      'Useful for simulating human-like input patterns.'),
  holdKeys: z.union([keySchema, z.array(keySchema)])
    .optional()
    .describe('Modifier keys to hold (e.g., Alt for Alt+1, Ctrl+Shift for Ctrl+Shift+A). Can be a key or key array.'),
}).strict();

const keyPressRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('keyPress'),
  variables: makeVariableUnion(keyPressRemoteVariableSchema),
}).strict().describe('Simulates keyboard input on the remote PC by sending key press events. ' +
  'Supports single keys, key combinations, and modifier keys with customizable timing and randomness. ' +
  'Use this for automating keyboard input or triggering keyboard shortcuts.');



const typeTextRemoteCommandSchema = baseRemoteCommandSchema.extend({
  performOnRemote: z.literal('typeText'),
  variables: z.object({
    text: z.union([variableValueSchema, z.string()])
      .describe('Any string to type'),
    keyDelay: z.union([variableValueSchema, z.number()])
      .default(0)
      .optional()
      .describe('Delay between keystroke in milliseconds. By default types as fast as possible, around 40ms per char'),
    keyDelayDeviation: z.union([
      variableValueSchema,
      z.number().positive(),
    ])
      .default(0)
      .optional()
      .describe('Deviation for randomness of delay. E.g if keyDelay = 100 and deviation = 0.2. Then value would be 80-120ms'),
  }).strict(),
}).strict().describe('Types text on the remote PC.');




type TypeTextRemoteCommand = z.infer<typeof typeTextRemoteCommandSchema>
type KeyPressRemoteCommand = z.infer<typeof keyPressRemoteCommandSchema>
type Key = z.infer<typeof keySchema>;

export type {
  TypeTextRemoteCommand,
  KeyPressRemoteCommand,
  Key,
};

export {
  keySchema,
  keyPressRemoteCommandSchema,
  typeTextRemoteCommandSchema,
};