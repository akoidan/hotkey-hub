import {Injectable} from '@nestjs/common';
import path from 'path';
import {ConfigPath} from '@/config/types/config-path';


@Injectable()
export class ConfigsPathService implements ConfigPath {
  private configPath?: string;
  private macroPath?: string;
  private variablePath?: string;

  private get configDir():string {
    const isNodeJs = process.execPath.endsWith('node') || process.execPath.endsWith('node.exe');
    const configDirs =  isNodeJs ? process.cwd() : path.dirname(process.execPath);
    return path.join(configDirs, 'configs');
  }

  public setConfigPaths(config?: string, macro?: string, variable?: string): void {
    this.configPath = config;
    this.macroPath = macro;
    this.variablePath = variable;
  }

  public get configFilePath(): string {
    // should default to calculated path if an empty string, so ?? no applicable
    // eslint-disable-next-line
    return this.configPath || path.join(this.configDir, 'config.jsonc');
  }

  public get macroFilePath(): string {
    // should default to calculated path if an empty string, so ?? no applicable
    // eslint-disable-next-line
    return this.macroPath || path.join(this.configDir, 'macros.jsonc');
  }

  public get variablesFilePath(): string {
    // should default to calculated path if an empty string, so ?? no applicable
    // eslint-disable-next-line
    return this.variablePath || path.join(this.configDir, 'variables.jsonc');
  }
}
