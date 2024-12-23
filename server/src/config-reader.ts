import {ConfigData, fullSchema} from '@/types';
import {readFile } from 'fs/promises';
import { join } from 'path';
import {parse} from 'jsonc-parser';

export class ConfigReader {
  async getConfig(): Promise<ConfigData> {
    const content = await readFile(join(__dirname, 'config.jsonc'), 'utf-8');
    const conf = parse(content);
    await fullSchema.parseAsync(conf);
    for (const k of conf.combinations) {
      console.log(`${k.shortCut} ${k.name}`)
    }
    return conf;
  }
}
