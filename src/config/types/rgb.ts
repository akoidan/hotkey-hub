import {z} from 'zod';

const rgbColorSchema = z.object({
  red: z.number().gte(0).lte(255),
  green: z.number().gte(0).lte(255),
  blue: z.number().gte(0).lte(255),
});

const rgbColorSchemaOn = rgbColorSchema
  .describe('RGB color for the keyboard Key when this shorcut is run')
  .default({red: 0, green: 255, blue: 0}).optional();

const rgbColorSchemaOff = rgbColorSchema
  .describe('RGB color for the keyboard Key when this shorcut is not running')
  .default({red: 0, green: 0, blue: 0}).optional();

const rgbColorSchemaError = rgbColorSchema
  .describe('RGB color for the keyboard Key when the shortcut has finished running but was resulted with error')
  .default({red: 255, green: 0, blue: 0}).optional();

const rgbSchema = z.object({
  deviceName: z.string().describe('Device name of the keyboard. ' +
    'You can extract it with "openrgb --list-devices" command. Select the name after number.' +
    ' Also you can check in openrgb UI in Devices Tab.'),
  clientName: z.string()
    .default('RPC')
    .describe('Name of this client when connecting to openrg')
    .optional(),
  onLed: rgbColorSchemaOn,
  offLed: rgbColorSchemaOff,
  errorLed: rgbColorSchemaOff,
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
  rgbColorSchemaOn,
  rgbColorSchemaOff,
  rgbColorSchemaError,
  rgbSchema,
};