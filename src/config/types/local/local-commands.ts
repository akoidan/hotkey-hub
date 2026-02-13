/* eslint-disable max-lines, @typescript-eslint/no-use-before-define */
import {z} from 'zod';

// Imports from subfiles
import {
  type ExpressionLocalCommand,
  expressionLocalCommandSchema,
  expressionSchema,
} from '@/config/types/local/expression-local-command';
import {type IfLocalCommand, ifLocalCommandSchema} from '@/config/types/local/if-local-command';
import {
  type TransactionLocalCommand,
  transactionLocalCommandSchema,
} from '@/config/types/local/transaction-local-command';
import {
  type Thread,
  threadLocalSchema,
  type ThreadsLocalCommand,
  threadsLocalCommandSchema,
} from '@/config/types/local/threads-local-command';
import {type LoopLocalCommand, loopLocalCommandSchema} from '@/config/types/local/loop-local-command';
import {
  type ShuffleLocalCommand,
  shuffleLocalCommandSchema,
  ShufflePolicy,
  shufflePolicySchema,
} from '@/config/types/local/shuffle-local-command';
import {type PrintLocalCommand, printLocalCommandSchema} from '@/config/types/local/print-local-command';
import {
  macroDefinitionSchema,
  type MacroList,
  type MacroLocalCommand,
  macroLocalCommandSchema,
  macrosListSchema,
  macroVariablesDescriptionSchema,
  macroVariableValueSchema,
} from '@/config/types/local/macro-local-command';

import {
  type ReloadConfigLocalCommand,
  reloadConfigLocalCommandSchema,
} from '@/config/types/local/relocal-config-local-command';

// Define localCommandSchema as union of all local command schemas
const localCommandSchema = z.lazy(() => z.union([
    macroLocalCommandSchema,
    expressionLocalCommandSchema,
    transactionLocalCommandSchema,
    threadsLocalCommandSchema,
    loopLocalCommandSchema,
    ifLocalCommandSchema,
    shuffleLocalCommandSchema,
    printLocalCommandSchema,
    reloadConfigLocalCommandSchema,
  ])).describe('A local command that would be executed on this machine');

// Define unknownCommandSchema as union of remote, get-info, and local

// Type definitions
type LocalCommand = z.infer<typeof localCommandSchema>;

export {
  // Shared schemas
  expressionSchema,
  expressionLocalCommandSchema,
  transactionLocalCommandSchema,
  threadsLocalCommandSchema,
  loopLocalCommandSchema,
  ifLocalCommandSchema,
  shuffleLocalCommandSchema,
  printLocalCommandSchema,
  reloadConfigLocalCommandSchema,

  // Other schemas
  macroVariableValueSchema,
  macroVariablesDescriptionSchema,
  macroDefinitionSchema,
  macrosListSchema,
  threadLocalSchema,
  shufflePolicySchema,
  ShufflePolicy,
  localCommandSchema,
};

export type {
  LocalCommand,
  ExpressionLocalCommand,
  IfLocalCommand,
  TransactionLocalCommand,
  Thread,
  ThreadsLocalCommand,
  LoopLocalCommand,
  ShuffleLocalCommand,
  PrintLocalCommand,
  MacroLocalCommand,
  ReloadConfigLocalCommand,
  MacroList,
};
