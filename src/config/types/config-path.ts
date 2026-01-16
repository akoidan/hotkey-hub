interface ConfigPath {
  configFilePath: string;

  setConfigPaths(config?: string, macro?: string, variable?: string): void;

  macroFilePath: string;
  variablesFilePath: string;
}


interface ZodErrorCollected {
  path: string;
  message: string;
  expected?: string[];
  received?: string;
}

const ConfigPathClass = 'ConfigPath';
const ENV = 'ProcessEnv';

export {ENV, ConfigPathClass};

export type {ZodErrorCollected, ConfigPath};