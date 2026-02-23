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

  public getConfigPath(): string {
    return this.configsPathService.configFilePath;
  }

  public setConfigFile(newPath: string): void {
    this.configsPathService.configFilePath = newPath;
  }

  public getConfigProvided(): boolean {
    return this.configsPathService.configProvided;
  }

  public async loadConfigString(): Promise<string> {
    this.logger.debug(`Loading config from ${this.configsPathService.configFilePath}`);
    return fs.readFile(this.configsPathService.configFilePath, 'utf8').catch((err: unknown) => {
      throw new Error(`Unable to open file, because ${(err as Error).message}`);
    });
  }


  public async loadVariablesConfigString(): Promise<string | null> {
    this.logger.debug(`Loading variable config from ${this.configsPathService.variablesFilePath}`);
    try {
      return await fs.readFile(this.configsPathService.variablesFilePath, 'utf8');
    } catch (error) {
      // eslint-disable-next-line max-len
      this.logger.warn(`Unable to load variables because of ${error?.message ?? error}`);
      return null;
    }
  }

  public async saveVariablesConfigString(variables: unknown): Promise<void> {
    await fs.writeFile(this.configsPathService.variablesFilePath, JSON.stringify(variables, null, 2));
     this.logger.debug(`Save variables to ${this.configsPathService.variablesFilePath}`);
  }
}
