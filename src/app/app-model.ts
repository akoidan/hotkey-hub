import type {Shortcut} from '@/config/types/shortcut';

interface ShortcutDescription {
  id: number;
  shortcut: Shortcut;
}

 interface AppConfig {
  configFile: string;
  variablesFile: string;
  certDir: string
}

export type {ShortcutDescription, AppConfig};