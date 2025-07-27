/* eslint-disable max-lines*/
import {z} from 'zod';


import {variablesSchema, variableValueSchema} from '@/config/types/variables';
import {shortcutSchema, shortcutsSchema} from '@/config/types/shortcut';
import {globalDelaySchema} from '@/config/types/delays';
import {
  delayCommandsSchema,
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
  remoteCommandSchema,
  typeTextRemoteCommandSchema,
} from '@/config/types/remote-commands';
import {
  expressionLocalCommandSchema, loopLocalCommandSchema,
  macroLocalCommandSchema,
  macroDefinitionSchema,
  macrosListSchema,
  macroVariablesDescriptionSchema,
  threadsLocalCommandSchema,
  transactionLocalCommandSchema,
  unknownCommandSchema,
} from '@/config/types/local-commands';

const ipsSchema = z.record(z.string().ip())
  .describe('Definition of remote PCs where keys are PC names and values are their IP addresses.' +
    ' The IP address should be available to a remote PC.' +
    ' You can also use https://ngrok.com/ to get public address or create VPN ');

const rgbSchema = z.object({
  deviceName: z.string().describe('Device name of the keyboard. ' +
      'You can extract it with "openrgb --list-devices" command. Select the name after number'),
  clientName: z.string().default('RPC').describe('Name of this client when connecting to openrg').optional(),
  serverPort: z.number().default(6742).describe('Port of the openrgb server').optional(),
  serverAddr: z.string().default('localhost').describe('Address of the openrgb server').optional(),
}).optional()
  .describe('Allows to set color on rgb keyboard to highlight the current executing shortcut.' +
      ' If not set won\'t be executed. openrgb server is required. See https://openrgb.org/');

const aARootSchema = z.object({
  ips: ipsSchema,
  clientPort: z.number()
    .optional()
    .default(5000)
    .describe('Https port to connect to on client PC'),
  rgb: rgbSchema,
  combinations: shortcutsSchema,
  delays: globalDelaySchema,
  macros: macrosListSchema,
}).strict();

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
  shortcutSchema,
  variableValueSchema,
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
  delayCommandsSchema,
  threadsLocalCommandSchema,
  macroLocalCommandSchema,
  unknownCommandSchema,
  expressionLocalCommandSchema,
  transactionLocalCommandSchema,
  macroVariablesDescriptionSchema,
  macroDefinitionSchema,
  macrosListSchema,
};
