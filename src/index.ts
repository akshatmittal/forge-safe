export interface BroadcastTransaction {
  hash: string | null;
  transactionType: string;
  contractName: string | null;
  contractAddress: string | null;
  function: string | null;
  arguments: string[] | null;
  transaction: {
    from: string;
    to?: string;
    gas: string;
    value: string;
    input: string;
    nonce: string;
    chainId: string;
  };
  additionalContracts: unknown[];
  isFixedGasLimit: boolean;
}

export interface BroadcastFile {
  transactions: BroadcastTransaction[];
  receipts: unknown[];
  libraries: unknown[];
  pending: unknown[];
  returns: Record<string, unknown>;
  timestamp: number;
  chain: number;
  commit: string;
}

export interface SafeTransaction {
  to: string;
  value: string;
  data: string | null;
  contractMethod: null;
  contractInputsValues: null;
}

export interface SafeBatch {
  version: string;
  chainId: string;
  createdAt: number;
  meta: {
    name: string;
    description: string;
    txBuilderVersion: string;
    createdFromSafeAddress: string;
    createdFromOwnerAddress: string;
    checksum: string;
  };
  transactions: SafeTransaction[];
}

export class UnsupportedTransactionError extends Error {
  constructor(
    public index: number,
    public transactionType: string,
    public contractName: string | null,
  ) {
    super(
      `Transaction #${index}${contractName ? ` (${contractName})` : ""} has unsupported type "${transactionType}". Only CALL and CREATE2 transactions are supported by Safe Transaction Builder.`,
    );
    this.name = "UnsupportedTransactionError";
  }
}

export function convertBroadcastToSafe(broadcast: BroadcastFile): SafeBatch {
  const unsupported: UnsupportedTransactionError[] = [];
  const transactions: SafeTransaction[] = [];

  for (let i = 0; i < broadcast.transactions.length; i++) {
    const tx = broadcast.transactions[i];

    if (tx.transactionType === "CREATE" || !tx.transaction.to) {
      unsupported.push(
        new UnsupportedTransactionError(
          i,
          tx.transactionType,
          tx.contractName,
        ),
      );
      continue;
    }

    transactions.push({
      to: tx.transaction.to,
      value: BigInt(tx.transaction.value).toString(),
      data: tx.transaction.input,
      contractMethod: null,
      contractInputsValues: null,
    });
  }

  if (unsupported.length > 0) {
    throw new AggregateError(
      unsupported,
      `Broadcast contains ${unsupported.length} unsupported transaction(s):\n${unsupported.map((e) => `  - ${e.message}`).join("\n")}`,
    );
  }

  return {
    version: "1.0",
    chainId: broadcast.chain.toString(),
    createdAt: broadcast.timestamp,
    meta: {
      name: "Transactions Batch",
      description: "",
      txBuilderVersion: "1.16.5",
      createdFromSafeAddress: "",
      createdFromOwnerAddress: "",
      checksum: "",
    },
    transactions,
  };
}
