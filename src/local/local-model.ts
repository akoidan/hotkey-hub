import type {Shortcut} from '@/config/types/shortcut';

export enum ProcessStatus {
  TERMINATING = 'TERMINATING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

export interface IterationDescription {
  id: string;
  status: ProcessStatus;
  shortCut: Shortcut;
}