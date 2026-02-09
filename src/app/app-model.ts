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
  enableApi: boolean;
  apiPort: number;
}

export type {ShortcutDescription, ReloadRequest, AppConfig};