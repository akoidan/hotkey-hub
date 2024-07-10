import { z, ZodIssueCode } from 'zod';

const ipsSchema = z.record(z.string().ip());

const aliasesSchema = z.record(z.array(z.string()));

const receiverSchemaSimple = z.object({
  destination: z.string(),
  keySend: z.string(),
});

const receiverSchemaId = z.object({
  destination: z.string(),
  id: z.string(),
  run: z.any(),
});

const receiverSchema = z.union([receiverSchemaSimple, receiverSchemaId]);

// Define the schema for the 'combinations' part
const combinationSchema = z.object({
  receivers: z.array(receiverSchema),
  shuffle: z.boolean().optional(),
  name: z.string(),
  shortCut: z.string(),
  circular: z.boolean().optional(),
});

// Define the full schema for the provided JSON structure
export const fullSchema = z.object({
  ips: ipsSchema,
  aliases: aliasesSchema,
  combinations: z.array(combinationSchema),
}).superRefine((data, ctx) => {
  // Ensure mapping values are arrays of keys from ips
  const ipsKeys = new Set(Object.keys(data.ips));
  Object.entries(data.aliases).forEach(([key, value]) => {
    value.forEach((v) => {
      if (!ipsKeys.has(v)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["aliases", key],
          message: `"${v}" is not a valid key from ips`,
        });
      }
    });
  });
});

// Generate TypeScript type
export type ConfigData = z.infer<typeof fullSchema>;
export type KeySend = string;
export type ConfigCombination = z.infer<typeof combinationSchema>
export type Ips = z.infer<typeof ipsSchema>
export type Aliases = z.infer<typeof aliasesSchema>
export type ReceiverSimple = z.infer<typeof receiverSchemaSimple>
export type ReceiverId = z.infer<typeof receiverSchemaId>
export type Receiver = z.infer<typeof receiverSchema>


