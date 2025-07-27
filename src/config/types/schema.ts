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
  expressionLocalCommandSchema,
  loopLocalCommandSchema,
  threadLocalArraySchema,
  macroLocalCommandSchema,
  macroDefinitionSchema,
  macrosListSchema,
  macroVariablesDescriptionSchema,
  threadsLocalCommandSchema,
  transactionLocalCommandSchema,
  unknownCommandSchema,
} from '@/config/types/local-commands';

const ipsSchema = z.record(z.string().ip())
  .describe('Defines the mapping of remote PC names to their IP addresses. Each key is a unique identifier for a remote PC, and its value is the IP address where that PC can be reached. ' +
    'The IP address must be accessible from the remote PC. ' +
    'For remote access over the internet, you can either use a VPN or a tunneling service like https://ngrok.com/ to create a public address.');

const rgbSchema = z.object({
  deviceName: z.string().describe('Device name of the keyboard. ' +
      'You can extract it with "openrgb --list-devices" command. Select the name after number'),
  clientName: z.string().default('RPC').describe('Name of this client when connecting to openrg').optional(),
  serverPort: z.number().default(6742).describe('Port of the openrgb server').optional(),
  serverAddr: z.string().default('localhost').describe('Address of the openrgb server').optional(),
}).optional()
  .describe('Configures RGB keyboard lighting to provide visual feedback for executing shortcuts. ' +
      'When enabled, it will change keyboard colors to highlight active shortcuts. ' +
      'Requires an OpenRGB server running (see https://openrgb.org/) and a keyboard that allow to light up individual keys and supported by OpenRGB. ' +
      'If this section is omitted, RGB features will be disabled.');

const aARootSchema = z.object({
  ips: ipsSchema,
  clientPort: z.number()
    .optional()
    .default(5000)
    .describe('The HTTPS port number used for secure connections to the client PC. ' +
      'This port must be accessible and not blocked by firewalls. ' +
      'Default is 5000 if not specified.'),
  rgb: rgbSchema,
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
  threadsLocalCommandSchema,
  macroLocalCommandSchema,
  unknownCommandSchema,
  expressionLocalCommandSchema,
  threadLocalArraySchema,
  transactionLocalCommandSchema,
  macroVariablesDescriptionSchema,
  macroDefinitionSchema,
  macrosListSchema,
};
