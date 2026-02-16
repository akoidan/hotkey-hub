import {configSchema} from '@/config/types/root';
import {promises as fs} from 'fs';
import path from 'path';
import {macrosListSchema} from '@/config/types/local/macro-local-command';

async function main(): Promise<void> {
  const rootSchema = configSchema.toJSONSchema();
  const macroSchema = macrosListSchema.toJSONSchema();
  const rootSchemaPath = path.resolve(__dirname, '..', '..', 'json-schema.json');
  const macroSchemaPath = path.resolve(__dirname, '..', '..', 'macros-schema.json');
  await Promise.any([
    fs.writeFile(rootSchemaPath, JSON.stringify(rootSchema, null, 2)),
    fs.writeFile(macroSchemaPath, JSON.stringify(macroSchema, null, 2)),
  ]);
}

void main();
