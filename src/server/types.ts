import { z, ZodIssueCode } from 'zod';

const ipsSchema = z.record(z.string().ip());

const aliasesSchema = z.record(z.array(z.string()));

const receiverSchemaSimple = z.object({
  destination: z.string(),
  keySend: z.string(),
  delay: z.number().optional(),
});

const receiverSchemaId = z.object({
  destination: z.string(),
  id: z.string(),
  delay: z.number().optional(),
  run: z.any(),
});

const receiverSchema = z.union([receiverSchemaSimple, receiverSchemaId]);

// Define the schema for the 'combinations' part
const combinationSchema = z.object({
  receivers: z.array(receiverSchema),
  shuffle: z.boolean().optional(),
  delay: z.number().optional(),
  name: z.string(),
  shortCut: z.string(),
  circular: z.boolean().optional(),
});

// Define the full schema for the provided JSON structure
export const fullSchema = z.object({
  ips: ipsSchema,
  aliases: aliasesSchema,
  delay: z.number(),
  combinations: z.array(combinationSchema),
}).superRefine((data, ctx) => {
  // Ensure mapping values are arrays of keys from ips
  const ipsKeys = new Set(Object.keys(data.ips));
  const alisesKeys = new Set(Object.keys(data.aliases));
  Object.entries(data.aliases).forEach(([key, value]) => {
    value.forEach((v) => {
      if (!ipsKeys.has(v)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["aliases", key],
          message: `"${v}" is not a valid key from ips, valid are ${JSON.stringify(Array.from(ipsKeys))}`,
        });
      }
    });
  });
   Object.entries(data.combinations).forEach(([key, value]) => {
    value.receivers.forEach((v) => {
      if (!alisesKeys.has(v.destination)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["combinations", "receivers", "destination"],
          message: `"${v.destination}" is not a valid key from destination, valid are ${JSON.stringify(Array.from(alisesKeys))}`,
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


