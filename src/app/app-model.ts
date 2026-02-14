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
  variablesFile: string;
  certDir: string;
  apiServer: boolean;
  logLevel: string;
  apiPort: number;
}

export const LOG_LEVEL = 'LOG_LEVEL';

export type {ShortcutDescription, ReloadRequest, AppConfig};