export interface ConfigPath {
  configFilePath: string;
  setConfigPaths(config?: string, macro?: string, variable?: string): void;
  macroFilePath: string;
  variablesFilePath: string;
}

export const ConfigPathClass = 'ConfigPath';
