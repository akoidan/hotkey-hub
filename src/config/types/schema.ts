/* eslint-disable max-lines*/
import {
  z,
  ZodIssueCode,
} from 'zod';

import {
  commandSchema,
  focusWindowCommandSchema,
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

const ipsSchema = z.record(z.string().ip())
  .describe('Definition of remote PCs where keys are PC names and values are their IP addresses.' +
    ' The IP address should be available to a remote PC.' +
    ' You can also use https://ngrok.com/ to get public address or create VPN ');

const aliasesValueObjectSchema = z.object({
  ipNames: z.array(z.string().describe('Value from "ips" section of this config')),
  circular: z.boolean().optional().describe('If set to true, only 1 ip will be used at the time.' +
    ' Otherwise will be executed on every element.').default(false),
});

const aliasesValueSchema = z.union([aliasesValueObjectSchema, z.string()]);

const aliasesSchema = z.record(aliasesValueSchema)
  .optional()
  .describe('A map for extra layer above destination property. E.g. you can define PC name in ' +
    'IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.');


const delaySchema = z.object({
  beforeCommand: z.number()
    .optional()
    .default(0)
    .describe('Global delay in miliseconds before execution every current commands in order to prevent spam.'),
  afterCommand: z.number()
    .optional()
    .default(0)
    .describe('Global delay in miliseconds before execution every current commands in order to prevent spam.'),
  standardDiviation: z.number()
    .positive()
    .max(1)
    .optional()
    .default(0)
    .describe('Random multiplier for delayAfter and delayBefore. initialDelay +/-initialDelay*random. ' +
      'E.g. if you specified 0.2, global delay 1s would be a random delay between 0.8 and 1.2s'),
  randomHugeDelay: z.number().positive().optional().default(0).describe("After standard delay is calcuated if randomHugeDelayChance is triggered, this delay will be added * standardDiviation to the standardDelay."),
  randomHugeDelayChance: z.number().positive().max(1).optional(),
});

const aARootSchema = z.object({
  ips: ipsSchema,
  aliases: aliasesSchema,
  clientPort: z.number()
    .optional()
    .default(5000)
    .describe('Https port to connect to on client PC'),
  combinations: combinationList,
  delays: delaySchema,
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

type IpsData = z.infer<typeof ipsSchema>
type AliasesData = z.infer<typeof aliasesSchema>
type AliasesValueData = z.infer<typeof aliasesValueSchema>
type DelayData = z.infer<typeof delaySchema>


export type {
  ConfigData,
  IpsData,
  AliasesData,
  DelayData,
  AliasesValueData,
};

export {
  aARootSchema,
  keySchema,
  shortCut,
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
  focusWindowCommandSchema,
  commandsSchema,
  leftMouseClickCommandSchema,
  runMacroCommandSchema,
  combinationList,
  mouseMoveClickCommandSchema,
  variablesSchema,
  killExeByNameCommandSchema,
  killExeByPidCommandSchema,
  commandOrMacroSchema,
  delaySchema
};

