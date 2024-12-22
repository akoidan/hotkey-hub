import {ConfigData, fullSchema} from '@/server/types';

import conf from '@/config.json';

export class ConfigReader {
  async getConfig(): Promise<ConfigData> {
    fullSchema.parse(conf);
    for (const k of conf.combinations) {
      console.log(`${k.shortCut} ${k.name}`)
    }
    return conf;
  }
}
