import {z, ZodIssueCode} from 'zod';
import {type VariableValue, variableValueSchema} from '@/config/types/variables';
import {schemaRootCache} from '@/config/types/cache';
import type {ConfigDataWoMacro} from '@/config/types/schema';

console.log('base-remote-command.ts: variableValueSchema', !!variableValueSchema);
console.log('base-remote-command.ts: schemaRootCache', !!schemaRootCache);

const delayCommandsSchema = z.object({
  delayAfter: z.union([variableValueSchema, z.number()]).optional()
    .describe('Delay (ms) after command completes, before next command. Ensures command has time to take effect.'),
  delayBefore: z.union([variableValueSchema, z.number()]).optional()
    .describe('Delay (ms) before executing command. Helps create precisely timed sequences.'),
}).strict();

const baseDestinationSchema = z.object({
  destination: z.union([variableValueSchema, z.string()]).superRefine((destination, ctx) => {
    const data: ConfigDataWoMacro = schemaRootCache.data ?? {ips: {}};
    const ipsKeys = new Set(Object.keys(data.ips ?? {}));

    if (!(destination as VariableValue).$ref && !data.ips[destination as string] ) {
      const allOptions = JSON.stringify(Array.from(ipsKeys));
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['destination'],
        message: `"${JSON.stringify(destination)}" is not a valid destination, possible options are ${allOptions}`,
      });
    }
  }).describe('Remote PC from ips or aliases section to send this command to'),
}).strict();

const baseRemoteCommandSchema = baseDestinationSchema.merge(delayCommandsSchema).extend({
  performOnRemote: z.string(),
}).strict();


type BaseRemoteCommand = z.infer<typeof baseRemoteCommandSchema>

type Delay = z.infer<typeof delayCommandsSchema>;

export type {
  BaseRemoteCommand,
  Delay,
};

export {
  baseRemoteCommandSchema,
  delayCommandsSchema,
  baseDestinationSchema,

};