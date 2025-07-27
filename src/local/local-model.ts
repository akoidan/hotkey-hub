export enum ProcessStatus {
  TERMINATING = 'TERMINATING',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

export interface IterationDescription {
  id: string;
  status: ProcessStatus;
}