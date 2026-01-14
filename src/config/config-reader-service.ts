import {Inject, Injectable, Logger} from '@nestjs/common';
import {promises as fs} from 'fs';
import {ConfigPath, ConfigPathClass} from '@/config/types/config-path';


@Injectable()
export class ConfigReaderService {
  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly logger: Logger,
    @Inject(ConfigPathClass)
    private readonly configsPathService: ConfigPath,
  ) {
  }

  public getId(): string {
    return this.configsPathService.configFilePath;
  }

  public async loadConfigString(): Promise<string> {
    this.logger.debug(`Loading config from ${this.configsPathService.configFilePath}`);
    return fs.readFile(this.configsPathService.configFilePath, 'utf8');
  }

  public async loadMacroConfigString(): Promise<string | null> {
    this.logger.debug(`Loading macro config from ${this.configsPathService.macroFilePath}`);
    try {
      return await fs.readFile(this.configsPathService.macroFilePath, 'utf8');
    } catch (error) {
      this.logger.warn(`Unable to load global macros from ${this.configsPathService.macroFilePath} because of ${error?.message ?? error}`);
      return null;
    }
  }

  public async loadVariablesConfigString(): Promise<string | null> {
    this.logger.debug(`Loading variable config from ${this.configsPathService.variablesFilePath}`);
    try {
      return await fs.readFile(this.configsPathService.variablesFilePath, 'utf8');
    } catch (error) {
      // eslint-disable-next-line max-len
      this.logger.warn(`Unable to load variables from ${this.configsPathService.variablesFilePath} because of ${error?.message ?? error}`);
      return null;
    }
  }

  public async saveVariablesConfigString(variables: unknown): Promise<void> {
    await fs.writeFile(this.configsPathService.variablesFilePath, JSON.stringify(variables, null, 2));
     this.logger.debug(`Save variables to ${this.configsPathService.variablesFilePath}`);
  }
}
