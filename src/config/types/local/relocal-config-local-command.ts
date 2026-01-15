// Define reusable field schemas
import {z} from 'zod';

const fieldDescriptions = {
  reloadConfig: 'Path to a new config. Leave it empty to use current path',
  reloadMacro: 'Path to a new macro config file. Leave it empty to use current path',
  reloadVariables: 'Path to a variable config file. Leave it empty to use current path',
};

// Base: all optional
const base = z.object({
  reloadConfig: z.string().optional().describe(fieldDescriptions.reloadConfig),
  reloadMacro: z.string().optional().describe(fieldDescriptions.reloadMacro),
  reloadVariables: z.string().optional().describe(fieldDescriptions.reloadVariables),
}).strict();

// Helper: mark one field as required+nonempty
function requireField<K extends keyof typeof fieldDescriptions>(
  key: K
): z.ZodObject<{ [P in keyof typeof fieldDescriptions]: P extends K ? z.ZodString : z.ZodOptional<z.ZodString>; }> {
  return base.extend({
    [key]: z.string().nonempty().describe(fieldDescriptions[key]),
  }) as z.ZodObject<{ [P in keyof typeof fieldDescriptions]: P extends K ? z.ZodString : z.ZodOptional<z.ZodString>; }>;
}

const reloadConfigLocalCommandSchema = z.union([
  requireField('reloadConfig'),
  requireField('reloadMacro'),
  requireField('reloadVariables'),
]).describe('Reloads config or loads config from a new place');


export {reloadConfigLocalCommandSchema};

export type ReloadConfigLocalCommand = z.infer<typeof reloadConfigLocalCommandSchema>;