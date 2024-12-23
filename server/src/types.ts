import {
  z,
  ZodIssueCode
} from 'zod';
import { Key } from '@nut-tree-fork/nut-js';
// @ts-expect-error
import KeyboardAction from "@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js";


export const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()]

const ipsSchema = z.record(z.string().ip());

const aliasesSchema = z.record(z.array(z.string()));

const keySchema = z.enum(possibleKeys as any);

const receiverSchemaKey = z.object({
  destination: z.string(),
  keySend: keySchema,
  delay: z.number().optional(),
});


const receiverSchemaLaunchExe = z.object({
  destination: z.string(),
  launch: z.string(),
  delay: z.number().optional(),
});

const receiverSchemaTypeText = z.object({
  destination: z.string(),
  typeText: z.string(),
  delay: z.number().optional(),
});

const receiverSchemaMouse = z.object({
  destination: z.string(),
  mouseMoveX: z.number(),
  mouseMoveY: z.number(),
  delay: z.number().optional(),
});


const receiverSchema = z.union([receiverSchemaKey, receiverSchemaMouse, receiverSchemaLaunchExe, receiverSchemaTypeText]);

// Define the schema for the 'combinations' part
const eventSchema = z.object({
  receivers: z.array(receiverSchema).optional(),
  receiversMulti: z.array(z.array(receiverSchema)).optional(),
  shuffle: z.boolean().optional(),
  delay: z.number().optional(),
  name: z.string(),
  shortCut: z.string(),
  circular: z.boolean().optional(),
}).refine(
  (data) =>
    (data.receivers && !data.receiversMulti) || (!data.receivers && data.receiversMulti),
  {
    message: 'Either receivers or receiversMulti must be present, but not both.',
    path: ['receivers', 'receiversMulti'], // Error will be shown for both fields
  }
);

// Define the full schema for the provided JSON structure
export const fullSchema = z.object({
  ips: ipsSchema,
  aliases: aliasesSchema,
  delay: z.number(),
  combinations: z.array(eventSchema),
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
    const allReceivers = value.receivers ?? value.receiversMulti.flat();
    allReceivers.forEach((v) => {
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
export type KeySend = z.infer<typeof keySchema>;
export type EventData = z.infer<typeof eventSchema>
export type Ips = z.infer<typeof ipsSchema>
export type Aliases = z.infer<typeof aliasesSchema>
export type ReceiverSimple = z.infer<typeof receiverSchemaKey>
export type ReceiverMouse = z.infer<typeof receiverSchemaMouse>
export type ReceiveExecute = z.infer<typeof receiverSchemaLaunchExe>
export type ReceiveTypeText = z.infer<typeof receiverSchemaTypeText>
export type Receiver = z.infer<typeof receiverSchema>
