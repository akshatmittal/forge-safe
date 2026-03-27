# forge-safe

Convert [Foundry](https://book.getfoundry.sh/) broadcast files into JSON files compatible with [Safe Transaction Builder](https://help.safe.global/en/articles/40841-transaction-builder), allowing you to use Foundry for creating Safe compatible batch transactions.

## Install

Use directly with `npx`/`pnpx`:

```bash
npx forge-safe broadcast.json
```

## Usage

### CLI

```bash
# Writes broadcast.safe.json next to the input file
forge-safe broadcast.json

# Custom output path
forge-safe broadcast.json -o batch.json

# Print to stdout
forge-safe broadcast.json --stdout
```

**Options:**

| Flag                  | Description                                        |
| --------------------- | -------------------------------------------------- |
| `-o, --output <file>` | Output file path (defaults to `<input>.safe.json`) |
| `--stdout`            | Print to stdout instead of writing a file          |
| `-h, --help`          | Show help                                          |

### Programmatic

```ts
import { convertBroadcastToSafe } from "forge-safe";
import { readFileSync } from "node:fs";

const broadcast = JSON.parse(readFileSync("broadcast.json", "utf-8"));
const safeBatch = convertBroadcastToSafe(broadcast);
```

## Supported transaction types

| Foundry type | Supported | Notes                                                        |
| ------------ | --------- | ------------------------------------------------------------ |
| `CALL`       | Yes       | Converted directly                                           |
| `CREATE2`    | Yes       | Calls the deterministic deployer factory                     |
| `CREATE`     | No        | No `to` address — incompatible with Safe Transaction Builder |

If a broadcast file contains any `CREATE` transactions, the CLI will exit with an error listing each unsupported transaction by index and contract name.

## How it works

Foundry's `forge script --broadcast` writes a JSON file to `broadcast/` containing all transactions from the script run. This tool reads that file and produces a JSON file that can be imported into Safe's Transaction Builder app to execute the same transactions as a multisig batch. Foundry does the same for dry-run executions as well which combined with the `--sender` flag can be used to produce Safe compatible broadcast files.

Each transaction is mapped as follows:

| Broadcast field           | Safe field               |
| ------------------------- | ------------------------ |
| `transaction.to`          | `to`                     |
| `transaction.value` (hex) | `value` (decimal string) |
| `transaction.input`       | `data`                   |
| `chain`                   | `chainId`                |

## License

MIT
