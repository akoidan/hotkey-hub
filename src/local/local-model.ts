import type {Shortcut} from '@/config/types/shortcut';

enum ProcessStatus {
  TERMINATING = 'TERMINATING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

const VERSION_INJ = 'VERSION';

export interface IterationDescription {
  id: string;
  status: ProcessStatus;
  shortCut: Shortcut;
}

export {VERSION_INJ, ProcessStatus};
