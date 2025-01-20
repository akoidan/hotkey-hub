/* eslint-disable max-lines*/
import {
  z,
  ZodIssueCode,
} from 'zod';
import {
  type MacroCommand,
  keySchema,
  commandOrMacroSchema,
  commandSchema,
  keyPressCommandSchema,
  launchExeCommandSchema,
  typeTextCommandSchema,
  runMacroCommandSchema,
  mouseClickCommandSchema,
  variableSchema,
  killExeCommandSchema,
  type Command,
  focusWindowCommandSchema,
} from '@/config/types/commands';


const ipsSchema = z.record(z.string().ip())
  .describe('Definition of remote PCs where keys are PC names and values are their IP addresses.' +
    ' The IP address should be available to a remote PC.' +
    ' You can also use https://ngrok.com/ to get public address or create VPN ');

const aliasesSchema = z.record(z.union([z.array(z.string()), z.string()]))
  .optional()
  .describe('A map for extra layer above destination property. E.g. you can define PC name in ' +
    'IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.');


const receiversAndMacrosArray = z.array(commandOrMacroSchema)
  .describe('A set of events that executed sequentially in this thread');// Define the schema for the 'combinations'
// part
const shortCutMappingSchema = z.object({
  commands: z.array(commandOrMacroSchema).optional().describe('List of commands for different commands'),
  threads: z.array(receiversAndMacrosArray).optional()
    .describe('This option should be defined only if commands attribute is absent.' +
      ' Same as commands but array of arrays of commands. Top level of array executes in parallel'),
  shuffle: z.boolean().optional().describe('If circular set to true, commands in this event would be executed randomly by 1'),
  delay: z.number().optional().describe('Delay in milliseconds between commands for this shorcut'),
  name: z.string().describe('Name that is printed during startup with a shorcut'),
  shortCut: z.string().describe('A shorcut to be pressed. E.g. Alt+1'),
  circular: z.boolean().optional().describe('If set to true. Commands in this chain will be executed in a circular way.' +
    ' So each press = 1 command. Instead of full commands'),
})
  .strict()
  .refine(
    (data) =>
      (data.commands && !data.threads) ?? (!data.commands && data.threads),
    {
      message: 'Either commands or threads must be present, but not both.',
      path: ['commands', 'threads'], // Error will be shown for both fields
    }
  ).describe('An event schema that represent a set of commands that is executed when a cirtain shortkey is pressed');


const macroVariablesDescription = z.record(z.object({
  type: z.enum(['string', 'number']).describe('To validate the type, or cast from env variables'),
  optional: z.boolean().optional().describe('If set to true, the key is be removed is var is not passed'),
}).strict().optional().describe('Set of variables for a macro'))
  .describe('Set of variables descriptors for macro');

const macroSchema = z.object({
  commands: z.array(commandSchema).describe('Set of commands for this macro'),
  variables: macroVariablesDescription,
}).strict().describe('A macro that can be injected instead of command. ' +
  'That will run commands from its body. Can be also injected with variables. Think of it like a function');


const variablesSchema = z.record(z.union([z.string(), z.number()]).describe('if number, parseInt will be used')).describe('Set of variable desciption along with default values');

const macrosMapSchema = z.record(macroSchema).optional().describe('A map of macros where a key is the macro name and value is its body');
// Define the full schema for the provided JSON structure
const aARootSchema = z.object({
  ips: ipsSchema,
  aliases: aliasesSchema,
  delay: z.number().describe('Global delay in miliseconds between commands in order to prevent spam. Could be set to 0'),
  combinations: z.array(shortCutMappingSchema).describe('Shorcuts mappings. Main logic'),
  macros: macrosMapSchema,
}).strict().superRefine((data, ctx) => {
  // Ensure mapping values are arrays of keys from ips
  const ipsKeys = new Set(Object.keys(data.ips));
  Object.entries(data.aliases ?? {}).forEach(([key, value]) => {
    const values = value instanceof Array ? value : [value];
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
}).superRefine((data, ctx) => {
  const alisesKeys = new Set(Object.keys(data.aliases ?? {}));
  const ipsKeys = new Set(Object.keys(data.ips));
  data.combinations.forEach((combin, combId) => {
    const commands = combin.commands ?? combin.threads!.flat();
    commands.forEach((command, receiverId) => {
      if (!(command as MacroCommand).macro && !alisesKeys.has((command as Command).destination) && !data.ips[(command as Command).destination]) {
        const allOptions = JSON.stringify([...Array.from(alisesKeys), ...Array.from(ipsKeys)]);
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['combinations',`name=${combin.name}[${combId}]`, 'commands', receiverId, 'destination'],
          message: `"${(command as Command).destination}" is not a valid destination, possible options are ${allOptions}`,
        });
      }
      if ((command as MacroCommand).macro) {
        if (!data.macros?.[(command as MacroCommand).macro]) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            path: ['combinations', `name=${combin.name}[${combId}]`, 'commands', receiverId, 'destination'],
            message: `Macro ${(command as MacroCommand).macro} doesn't exist`,
          });
        } else if ((command as MacroCommand).variables) {
          for (const [key, value] of Object.entries((command as MacroCommand).variables!)) {
            if (!data.macros[(command as MacroCommand).macro]?.variables?.[key]) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                path: ['combinations', `name=${combin.name}[${combId}]`, 'commands', receiverId, 'variables', key],
                message: `Passed variable ${key}=${value} doesn't have a description on macro`,
              });
            }
          }
          for (const [key, value] of Object.entries(data.macros[(command as MacroCommand).macro]!.variables)) {
            if ((command as MacroCommand).variables?.[key] && value!.type !== typeof (command as MacroCommand).variables?.[key]) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                path: ['combinations', `name=${combin.name}[${combId}]`, 'commands', receiverId, 'variables', key],
                message: `Passed variable ${key}=${(command as MacroCommand).variables?.[key]} type of ${typeof (command as MacroCommand).variables?.[key]}, expected ${value!.type}`,
              });
            }
            if (!value!.optional && !(command as MacroCommand).variables?.[key]) {
              ctx.addIssue({
                code: ZodIssueCode.custom,
                path: ['combinations', `name=${combin.name}[${combId}]`, 'commands', receiverId, 'variables', key],
                message: `macro ${(command as MacroCommand).macro} requires variable ${key} but only ${JSON.stringify((command as MacroCommand).variables)} were passed`,
              });
            }
          }
        }
      }
    });
  });
}).superRefine((data, ctx) => {
  const shortCuts = new Map<string, number>();
  data.combinations.forEach((value, i) => {
    if (shortCuts.has(value.shortCut)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['combinations', 'shortcut', i],
        message: `Shortcut ${value.shortCut} already exists at index ${shortCuts.get(value.shortCut)}`,
      });
    }
    shortCuts.set(value.shortCut, i);
  });
});

// Generate TypeScript type
type ConfigData = z.infer<typeof aARootSchema>;
type EventData = z.infer<typeof shortCutMappingSchema>
type Ips = z.infer<typeof ipsSchema>
type Aliases = z.infer<typeof aliasesSchema>
type Variables = z.infer<typeof variablesSchema>
type MacroList = z.infer<typeof macrosMapSchema>

export type {
  ConfigData,
  EventData,
  Ips,
  Variables,
  Aliases,
  MacroList,
};

export {
  aARootSchema,
  keySchema,
  variablesSchema,
  macrosMapSchema,
  macroVariablesDescription,
  shortCutMappingSchema,
  macroSchema,
  commandSchema,
  keyPressCommandSchema,
  receiversAndMacrosArray,
  launchExeCommandSchema,
  typeTextCommandSchema,
  focusWindowCommandSchema,
  runMacroCommandSchema,
  mouseClickCommandSchema,
  killExeCommandSchema,
  commandOrMacroSchema,
};

