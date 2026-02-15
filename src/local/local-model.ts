import type {Shortcut} from '@/config/types/shortcut';

enum ProcessStatus {
  TERMINATING = 'TERMINATING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

export interface IterationDescription {
  id: string;
  status: ProcessStatus;
  shortCut: Shortcut;
}

export {ProcessStatus};
