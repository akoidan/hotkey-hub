import { ConfigData } from '@/server/types';
import { plainToInstance } from 'class-transformer';

import conf from '@/config.json';
import { validate } from 'class-validator';

export class ConfigReader {
  async getConfig(): Promise<ConfigData> {
    const config = plainToInstance(ConfigData, conf);
    // Validate the schema
    await validate(config);
    for (const k of conf.combinations) {
      console.log(`${k.shortCut} ${k.name}`)
    }
    return config;
  }
}
