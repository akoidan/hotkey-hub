/* eslint-disable max-lines*/
import {z, ZodArray, ZodEffects, ZodLazy, ZodObject, ZodTypeAny, ZodUnion} from 'zod';


import {variablesSchema, variableValueSchema} from '@/config/types/variables';
import {behaviourObjectSchema, behaviourSchema, shortcutSchema, shortcutsSchema} from '@/config/types/shortcut';
import {globalDelaySchema} from '@/config/types/delays';
import {
  findPidsByNameRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
  findProcessWindowsRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  keyPressRemoteCommandSchema,
  keySchema,
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  remoteCommandSchema, setWindowBoundsRemoteSchema,
  typeTextRemoteCommandSchema, windowPropertiesSchema,
} from '@/config/types/remote-commands';
import {
  expressionLocalCommandSchema,
  loopLocalCommandSchema,
  macroDefinitionSchema,
  macroLocalCommandSchema,
  reloadConfigLocalCommandSchema,
  macrosListSchema,
  macroVariablesDescriptionSchema,
  threadLocalArraySchema,
  threadsLocalCommandSchema,
  transactionLocalCommandSchema,
  unknownCommandSchema,
} from '@/config/types/local-commands';

const ipsSchema = z.record(z.string().ip())
  .describe('Maps PC names to IP addresses. Each key identifies a remote PC, value is its IP. IP must be accessible from remote PC. ' +
    'For internet access, use VPN or tunneling (e.g. ngrok.com).');

const rgbSchema = z.object({
  deviceName: z.string().describe('Device name of the keyboard. ' +
    'You can extract it with "openrgb --list-devices" command. Select the name after number.' +
    ' Also you can check in openrgb UI in Devices Tab.'),
  clientName: z.string().default('RPC').describe('Name of this client when connecting to openrg').optional(),
  serverPort: z.number().default(6742).describe('Port of the openrgb server').optional(),
  serverAddr: z.string().default('localhost').describe('Address of the openrgb server').optional(),
  keyMapFn: z.string()
    .default('x.toLowerCase().replace(\' arrow\', \'\').replace(\'key: \', \'\').replace(\' (ansi)\', \'\').replace(\' \', \'_\')')
    .describe('Mapping of keyboard api key name to default map key names. ' +
      'This should be a JS expression that accept variable "x" and evaluates to a string')
    .optional(),
}).strict().optional()
  .describe('RGB keyboard lighting for shortcut feedback. Changes key colors during execution.' +
    ' You need to run openrgb server for it, which you can download from https://openrgb.org.' +
    ' Run the application, go to the SDK server tab and click on Start server.' +
    ' Needs OpenRGB server and compatible keyboard, the supported keyboards are here: https://openrgb.org/devices.html.' +
    ' For Linux just install openrgb via your package manager and run the openrgb from root with you default service manager like systemd');

const aARootSchema = z.object({
  ips: ipsSchema,
  clientPort: z.number()
    .optional()
    .default(5000)
    .describe('HTTPS port for secure client PC connections. ' +
      'Must be accessible and not blocked by firewalls. Default is 5000 if not specified.'),
  rgb: rgbSchema,
  name: z.string().optional().describe('Name of this schema to print in logs'),
  combinations: shortcutsSchema,
  delays: globalDelaySchema,
  macros: macrosListSchema,
}).strict()
  .describe('Root configuration schema that defines the entire setup including remote PCs, shortcuts, RGB settings, and macros. ' +
    'All sections must follow their respective schemas strictly.');

// Generate TypeScript type
type ConfigData = z.infer<typeof aARootSchema>;
type ConfigDataWoMacro = Omit<ConfigData, 'macros'>;

type IpsData = z.infer<typeof ipsSchema>
type RgbData = z.infer<typeof rgbSchema>


export type {
  ConfigDataWoMacro,
  ConfigData,
  IpsData,
  RgbData,
};

export {
  rgbSchema,
  aARootSchema,
  globalDelaySchema,
  ipsSchema,
  behaviourSchema,
  variableValueSchema,
  behaviourObjectSchema,
  windowPropertiesSchema,
  shortcutSchema,
  shortcutsSchema,
  loopLocalCommandSchema,
  variablesSchema,
  keyPressRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
  findPidsByNameRemoteCommandSchema,
  findProcessWindowsRemoteCommandSchema,
  findProcessesWindowsRemoteCommandSchema,
  remoteCommandSchema,
  keySchema,
  threadsLocalCommandSchema,
  macroLocalCommandSchema,
  unknownCommandSchema,
  setWindowBoundsRemoteSchema,
  expressionLocalCommandSchema,
  threadLocalArraySchema,
  transactionLocalCommandSchema,
  macroVariablesDescriptionSchema,
  macroDefinitionSchema,
  macrosListSchema,
  reloadConfigLocalCommandSchema,
};
