import {z} from 'zod/index';
import {shortcutsSchema} from '@/config/types/shortcut';
import {globalDelaySchema} from '@/config/types/delays';
import {macrosListSchema} from '@/config/types/local/macro-local-command';

const ipsSchema = z.record(z.string(), z.string())
    .describe('Maps PC names to IP addresses or host names.' +
        ' Each key identifies a remote PC, value is its IP/Domain. The address must be accessible from this PC. ' +
        'For internet access, use VPN or tunneling (e.g. ngrok.com).');

const rgbSchema = z.object({
  deviceName: z.string().describe('Device name of the keyboard. ' +
      'You can extract it with "openrgb --list-devices" command. Select the name after number.' +
      ' Also you can check in openrgb UI in Devices Tab.'),
  clientName: z.string()
      .default('RPC')
      .describe('Name of this client when connecting to openrg')
      .optional(),
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

const configSchema = z.object({
  ips: ipsSchema,
  clientPort: z.number()
      .default(5000)
      .optional()
      .describe('HTTPS port for secure client PC connections. ' +
          'Must be accessible and not blocked by firewalls. Default is 5000 if not specified.'),
  rgb: rgbSchema,
  name: z.string()
      .optional()
      .describe('Name of this schema to print in logs'),
  combinations: shortcutsSchema,
  delays: globalDelaySchema,
  macros: macrosListSchema,
}).strict()
    .describe('Root configuration schema that defines the entire setup including remote PCs, shortcuts, RGB settings, and macros. ' +
        'All sections must follow their respective schemas strictly.');

// Generate TypeScript type
type ConfigData = z.infer<typeof configSchema>;

type IpsData = z.infer<typeof ipsSchema>
type RgbData = z.infer<typeof rgbSchema>

export {
  rgbSchema,
  configSchema,
  globalDelaySchema,
  ipsSchema,
};


export type {
  ConfigData,
  IpsData,
  RgbData,
};