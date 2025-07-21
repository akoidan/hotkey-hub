export enum ProcessStatus {
  TERMINATING,
  RUNNING,
  STOPPED,
}

export interface IterationDescription {
  id: string;
  status: ProcessStatus;
}