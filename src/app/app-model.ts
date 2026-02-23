import type {Shortcut} from '@/config/types/shortcut';

interface ShortcutDescription {
  id: number;
  shortcut: Shortcut;
}


interface ReloadRequest {
  configFile?: string;
  variablesFile?: string;
}

 interface AppConfig {
  configFile: string;
  configProvided: boolean;
  variablesFile: string;
  certDir: string;
  apiServer: boolean;
  logLevel: string;
  apiPort: number;
}

const LOG_LEVEL = 'LOG_LEVEL';
const VERSION_INJ = 'VERSION';

export {LOG_LEVEL, VERSION_INJ};

export type {ShortcutDescription, ReloadRequest, AppConfig};