import {configSchema} from '@/config/types/root';
import {promises as fs} from 'fs';
import path from 'path';

async function main(): Promise<void> {
  const rootSchema = configSchema.toJSONSchema();
  const rootSchemaPath = path.resolve(__dirname, '..', '..', 'json-schema.json');
  await fs.writeFile(rootSchemaPath, JSON.stringify(rootSchema, null, 2));
}

void main();
