import {Inject, Injectable} from '@nestjs/common';
import {ConfigPath} from '@/config/types/config-path';
import {CONFIG_FILE, VARIABLES_FILE} from '@/config/config-model';


@Injectable()
export class ConfigsPathService implements ConfigPath {
  constructor(
    @Inject(CONFIG_FILE) public configFilePath: string,
    @Inject(VARIABLES_FILE) public variablesFilePath: string,
  ) {
  }

  public setConfigPaths(config?: string, variable?: string): void {
    if (config) {
      this.configFilePath = config;
    }
    if (variable) {
      this.variablesFilePath = variable;
    }
  }
}
