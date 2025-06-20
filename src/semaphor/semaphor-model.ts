interface ResolveTG {
  resolve(): void;
  resolveFrom: string;
  transactionId: string;
}

interface NonResolveTG {
  resolve: null;
  resolveFrom: null;
  transactionId: string;
}

type TransactionGroups = Record<string, (ResolveTG | NonResolveTG)[]>

export type {ResolveTG, NonResolveTG, TransactionGroups};