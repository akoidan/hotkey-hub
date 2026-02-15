interface QueueGroupItem {
  id: string;
  sleep: number;
}

type QueueItem = QueueGroupItem | number;

export type {QueueItem, QueueGroupItem};
