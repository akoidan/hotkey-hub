import {Inject, Injectable} from '@nestjs/common';
import path from 'path';
import {ConfigPath} from '@/config/types/config-path';
import {CONFIG_DIR} from '@/config/config-model';


@Injectable()
export class ConfigsPathService implements ConfigPath {
  configFilePath: string;
  macroFilePath: string;
  variablesFilePath: string;

  constructor(@Inject(CONFIG_DIR) private readonly configDir: string) {
    this.configFilePath = path.join(this.configDir, 'config.jsonc');
    this.macroFilePath = path.join(this.configDir, 'macros.jsonc');
    this.variablesFilePath = path.join(this.configDir, 'variables.jsonc');
  }

  public setConfigPaths(config?: string, macro?: string, variable?: string): void {
    if (config) {
      this.configFilePath = config;
    }
    if (macro) {
      this.macroFilePath = macro;
    }
    if (variable) {
      this.variablesFilePath = variable;
    }
  }
}
