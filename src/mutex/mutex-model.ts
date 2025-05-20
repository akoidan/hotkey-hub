export interface QueuedTransaction {
  id: string;
  resolve: (() => void) | null;
  resolveId: string | null;
}
