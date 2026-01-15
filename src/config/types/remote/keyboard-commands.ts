import {z} from 'zod';
import {baseRemoteCommandSchema} from '@/config/types/remote/base-remote-command';
import {makeVariableUnion} from '@/config/types/utils';
import {variableValueSchema} from '@/config/types/variables';
import {allowedKeys, modifierKeys} from '@/config/types/keyboard';

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
      .default(100) //
      .optional()
      .describe('Delay between keystroke in milliseconds. By default types as fast as possible, around 40ms per char'),
    keyDelayDeviation: z.union([
      variableValueSchema,
      z.number().positive(),
    ])
      .default(0.1)
      .optional()
      .describe('Deviation for randomness of delay. E.g if keyDelay = 100 and deviation = 0.2. Then value would be 80-120ms'),
  }).strict(),
}).strict().describe('Types text on the remote PC.');

const keyboardCommands = z.union([
  keyPressRemoteCommandSchema,
  typeTextRemoteCommandSchema,
]).describe('Keyboard-related remote commands');

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
  keyboardCommands,
};