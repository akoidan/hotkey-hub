interface ConfigPath {
  configFilePath: string;

  setConfigPaths(config?: string, macro?: string, variable?: string): void;

  macroFilePath: string;
  variablesFilePath: string;
}

const ConfigPathClass = 'ConfigPath';
const ENV = 'ProcessEnv';

export {ENV, ConfigPathClass};

export type {ConfigPath};