/* eslint-disable max-lines*/
import {z} from 'zod';


import {variablesSchema, variableValueSchema} from '@/config/types/variables';
import {behaviourObjectSchema, shortcutSchema, shortcutsSchema} from '@/config/types/shortcut';
import {globalDelaySchema} from '@/config/types/delays';
import {keyPressRemoteCommandSchema, keySchema, typeTextRemoteCommandSchema} from '@/config/types/remote/keyboard-commands';
import {leftMouseClickRemoteCommandSchema, mouseMoveClickRemoteCommandSchema} from '@/config/types/remote/mouse-commands';
import {
  killExeByNameRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  launchExeRemoteCommandSchema,
} from '@/config/types/remote/process-commands';
import {
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  setWindowBoundsRemoteSchema,
  windowPropertiesSchema,
} from '@/config/types/remote/window-commands';
import {type RemoteCommand, remoteCommandSchema} from '@/config/types/remote/remote-commands';
import {
  type ExpressionLocalCommand,
  expressionLocalCommandSchema, type IfLocalCommand,
  ifLocalCommandSchema, localCommandSchema, type LoopLocalCommand,
  loopLocalCommandSchema,
  macroDefinitionSchema,
  macroLocalCommandSchema,
  macrosListSchema,
  macroVariablesDescriptionSchema,
  macroVariableValueSchema, type PrintLocalCommand,
  printLocalCommandSchema,
  reloadConfigLocalCommandSchema, type ShuffleLocalCommand,
  shuffleLocalCommandSchema,
  threadLocalArraySchema, type ThreadsLocalCommand,
  threadsLocalCommandSchema, type TransactionLocalCommand,
  transactionLocalCommandSchema,
  unknownCommandSchema,
} from '@/config/types/local/local-commands';
import {
  getActiveWindowIdSchema,
  getWindowBoundsSchema,
  getWindowOpacitySchema,
  getWindowOwnerSchema,
  getWindowsIdByPidSchema,
  getWindowTitleSchema,
  isWindowSchema,
  isWindowVisibleSchema,
} from '@/config/types/get-commands/get-window-commands';
import {
  getMonitorFromWindowSchema,
  getMonitorInfoSchema,
  getMonitorScaleFactorSchema,
  getMonitorsSchema,
} from '@/config/types/get-commands/get-monitor-commands';
import {getPidsByNameSchema, getProcessMainWindowSchema} from '@/config/types/get-commands/get-process-commands';
import {getInfoRemoteCommandSchema, pingSchema} from '@/config/types/get-commands/get-commands';

 // z.lazy requires manual type definition cause of reqursive type


const remoteAddressDefinition = z.union([z.string().ip(), z.string().regex(
  /^(?:[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)$/u,
  'Invalid domain name'
),
]).describe('Remote host. Must be resolvable from the current PC');

const ipsSchema = z.record(remoteAddressDefinition)
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
  pingSchema,
  getWindowsIdByPidSchema,
  getActiveWindowIdSchema,
  getWindowBoundsSchema,
  getWindowTitleSchema,
  getWindowOpacitySchema,
  getWindowOwnerSchema,
  isWindowSchema,
  isWindowVisibleSchema,
  getMonitorsSchema,
  getMonitorInfoSchema,
  getMonitorFromWindowSchema,
  getMonitorScaleFactorSchema,
  getProcessMainWindowSchema,
  getPidsByNameSchema,
  remoteAddressDefinition,
  rgbSchema,
  aARootSchema,
  globalDelaySchema,
  ipsSchema,
  variableValueSchema,
  behaviourObjectSchema,
  ifLocalCommandSchema,
  printLocalCommandSchema,
  getInfoRemoteCommandSchema,
  windowPropertiesSchema,
  shortcutSchema,
  shortcutsSchema,
  loopLocalCommandSchema,
  variablesSchema,
  macroVariableValueSchema,
  keyPressRemoteCommandSchema,
  leftMouseClickRemoteCommandSchema,
  mouseMoveClickRemoteCommandSchema,
  launchExeRemoteCommandSchema,
  focusProcessWindowRemoteCommandSchema,
  focusWindowRemoteCommandSchema,
  typeTextRemoteCommandSchema,
  killExeByPidRemoteCommandSchema,
  killExeByNameRemoteCommandSchema,
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
  shuffleLocalCommandSchema,
};
