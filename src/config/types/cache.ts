import type {ConfigData} from '@/config/types/root';
import {type ValidateFunction, Ajv} from 'ajv';
import type {JsonSchema} from '@/config/types/local/macro-local-command';

const ajv = new Ajv({strict: false, strictSchema: true});

const cache = new Map<JsonSchema, ValidateFunction>();

export const schemaRootCache: {
  data: ConfigData,
  getSchema(schema: JsonSchema): ValidateFunction,
} = {
  data: null!,
  getSchema(schema: JsonSchema): ValidateFunction {
    if (!cache.has(schema)) {
      cache.set(schema, ajv.compile(schema));
    }
    return cache.get(schema)!;
  },
};
