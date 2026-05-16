import type {Shortcut} from '@/config/types/shortcut';

enum ProcessStatus {
  TERMINATING = 'TERMINATING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

interface IterationThread {
  sleepId: NodeJS.Timeout |null;
  resolve: ((a: unknown) => void)|null;
}

interface IterationDescription {
  id: string;
  status: ProcessStatus;
  shortCut: Shortcut;
  controller: AbortController;
}

const SET_TIMEOUT_TOKEN = 'SET_TIMEOUT';
const PROCESS_TOKEN = 'PROCESS';

export type {IterationThread, IterationDescription};

export {ProcessStatus, SET_TIMEOUT_TOKEN, PROCESS_TOKEN};