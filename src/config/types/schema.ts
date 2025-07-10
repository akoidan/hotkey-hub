/* eslint-disable max-lines*/
import {
  z,
  ZodIssueCode,
} from 'zod';

import {
  commandSchema, evaluateVariableSchema,
  focusProcessWindowCommandSchema,
  keyPressCommandSchema,
  keySchema,
  killExeByNameCommandSchema,
  killExeByPidCommandSchema,
  launchExeCommandSchema,
  leftMouseClickCommandSchema,
  mouseMoveClickCommandSchema,
  typeTextCommandSchema,
} from '@/config/types/commands';
import {
  variablesSchema,
  variableValueSchema,
} from '@/config/types/variables';
import {
  commandOrMacroSchema,
  runMacroCommandSchema,
  macroSchema,
  macrosDefinitionSchema,
  macroVariablesDescriptionSchema,
} from '@/config/types/macros';
import {
  randomShortCutMappingSchema,
  shortcutMappingWithMacroSchema,
  commandsAndMacrosArraySchema,
  commandsSchema,
  combinationList,
  threadCircularShortCutMappingSchema,
  shortCut,
} from '@/config/types/shortcut';
import {globalDelaySchema} from '@/config/types/delays';

const ipsSchema = z.record(z.string().ip())
  .describe('Definition of remote PCs where keys are PC names and values are their IP addresses.' +
    ' The IP address should be available to a remote PC.' +
    ' You can also use https://ngrok.com/ to get public address or create VPN ');

const aliasesValueObjectSchema = z.object({
  ipNames: z.array(z.string()).describe('Value from "ips" section of this config'),
  circular: z.boolean().optional().describe('If set to true, only 1 ip will be used at the time.' +
    ' Otherwise will be executed on every element.').default(false),
});

const aliasesValueSchema = z.union([aliasesValueObjectSchema, z.string()]);

const aliasesSchema = z.record(aliasesValueSchema)
  .optional()
  .describe('A map for extra layer above destination property. E.g. you can define PC name in ' +
    'IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.');


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
  aliases: aliasesSchema,
  clientPort: z.number()
    .optional()
    .default(5000)
    .describe('Https port to connect to on client PC'),
  rgb: rgbSchema,
  combinations: combinationList,
  delays: globalDelaySchema,
  macros: macrosDefinitionSchema,
}).strict().superRefine((data, ctx) => {
  // Ensure mapping values are arrays of keys from ips
  const ipsKeys = new Set(Object.keys(data.ips));
  Object.entries(data.aliases ?? {}).forEach(([key, value]) => {
    const values = typeof value === 'string' ? [value] : value.ipNames;
    if (ipsKeys.has(key)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['aliases', key],
        message: `Alias ${key} should not be the same as a key from ips`,
      });
    }
    values.forEach((v) => {
      if (!ipsKeys.has(v)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['aliases', key],
          message: `"${v}" is not a valid key from ips, valid are ${JSON.stringify(Array.from(ipsKeys))}`,
        });
      }
    });
  });
});

// Generate TypeScript type
type ConfigData = z.infer<typeof aARootSchema>;
type ConfigDataWoMacro = Omit<ConfigData, 'macros'>;

type IpsData = z.infer<typeof ipsSchema>
type AliasesData = z.infer<typeof aliasesSchema>
type RgbData = z.infer<typeof rgbSchema>
type AliasesValueData = z.infer<typeof aliasesValueSchema>


export type {
  ConfigDataWoMacro,
  ConfigData,
  IpsData,
  RgbData,
  AliasesData,
  AliasesValueData,
};

export {
  rgbSchema,
  aARootSchema,
  keySchema,
  shortCut,
  globalDelaySchema,
  macroSchema,
  macrosDefinitionSchema,
  macroVariablesDescriptionSchema,
  randomShortCutMappingSchema,
  threadCircularShortCutMappingSchema,
  shortcutMappingWithMacroSchema,
  commandSchema,
  ipsSchema,
  aliasesSchema,
  aliasesValueSchema,
  aliasesValueObjectSchema,
  variableValueSchema,
  keyPressCommandSchema,
  commandsAndMacrosArraySchema,
  launchExeCommandSchema,
  typeTextCommandSchema,
  evaluateVariableSchema,
  focusProcessWindowCommandSchema,
  commandsSchema,
  leftMouseClickCommandSchema,
  runMacroCommandSchema,
  combinationList,
  mouseMoveClickCommandSchema,
  variablesSchema,
  killExeByNameCommandSchema,
  killExeByPidCommandSchema,
  commandOrMacroSchema,
};

