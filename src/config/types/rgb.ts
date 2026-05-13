import {z} from 'zod';

const hexColorSchema = z.string()
  .regex(/^#?(?:[0-9A-Fa-f]{6})$/u, 'Invalid hex color');


const rgbSchema = z.object({
  deviceName: z.string().describe('Device name of the keyboard. ' +
    'You can extract it with "openrgb --list-devices" command. Select the name after number.' +
    ' Also you can check in openrgb UI in Devices Tab.'),
  clientName: z.string()
    .default('RPC')
    .describe('Name of this client when connecting to openrg')
    .optional(),
  onLed: hexColorSchema
    .default('#00FF00').describe('Color for the keyboard Key when this shorcut is run'),
  offLed: hexColorSchema
    .default('#000000').describe('Color for the keyboard Key when this shorcut is not running'),
  errorLed: hexColorSchema.default('#FF0000').describe('Color for the keyboard Key when the shortcut' +
    ' has finished running but was resulted with error'),
  serverPort: z.number()
    .default(6742)
    .describe('Port of the openrgb server')
    .optional(),
  serverAddr: z.string()
    .default('localhost')
    .describe('Address of the openrgb server')
    .optional(),
  keyMapFn: z.string()
    // eslint-disable-next-line max-len
    .default('x.toLowerCase().replace(" arrow", "").replace("pause/break", "pause").replace("key: ", "").replace(" (ansi)", "").replace(" ", "_")')
    .describe('Mapping of openRGB provided keyboard "key" schema. In other words input: openRgb keyboard provider key name. ' +
      'Output should be a string a type of "key" schema.' +
      'This should be a JS expression that accept variable "x" and evaluates to a string. ' +
      'Allows to properly setup mapping in order to avoid exceptions like "key XXX is not present in keymap". ' +
      'Default value works for keyboard brand HyperX')
    .optional(),
}).strict()
  .optional()
  .describe('RGB keyboard lighting for shortcut feedback. Changes key colors during execution.' +
    ' You need to run openrgb server for it, which you can download from https://openrgb.org.' +
    ' Run the application, go to the SDK server tab and click on Start server.' +
    ' Needs OpenRGB server and compatible keyboard, the supported keyboards are here: https://openrgb.org/devices.html.' +
    ' For Linux just install openrgb via your package manager and run the openrgb from root with you default service ' +
    'manager like systemd');


type RgbData = z.infer<typeof rgbSchema>

export type {
  RgbData,
};

export {
  rgbSchema,
};