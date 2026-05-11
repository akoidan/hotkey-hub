interface ConfigPath {
  configFilePath: string;

  setConfigPaths(config?: string, variable?: string): void;

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