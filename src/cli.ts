#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import {
  convertBroadcastToSafe,
  type BroadcastFile,
} from "./index.js";

const HELP = `forge-safe - Convert Foundry broadcast files to Safe Transaction Builder JSON

Usage:
  forge-safe <broadcast-file> [-o <output-file>]
  forge-safe <broadcast-file> [--output <output-file>]

Options:
  -o, --output  Output file path (defaults to <input-name>.safe.json)
  -h, --help    Show this help message
  --stdout      Print to stdout instead of writing a file`;

function parseArgs(argv: string[]) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }

  let inputFile: string | undefined;
  let outputFile: string | undefined;
  let useStdout = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--output" || arg === "-o") {
      outputFile = args[++i];
      if (!outputFile) {
        console.error("Error: --output requires a file path");
        process.exit(1);
      }
    } else if (arg === "--stdout") {
      useStdout = true;
    } else if (!arg.startsWith("-")) {
      inputFile = arg;
    } else {
      console.error(`Error: Unknown option "${arg}"`);
      process.exit(1);
    }
  }

  if (!inputFile) {
    console.error("Error: No input file specified");
    process.exit(1);
  }

  return { inputFile, outputFile, useStdout };
}

function defaultOutputPath(inputFile: string): string {
  const name = basename(inputFile, ".json");
  return resolve(inputFile, "..", `${name}.safe.json`);
}

function main() {
  const { inputFile, outputFile, useStdout } = parseArgs(process.argv);

  const inputPath = resolve(inputFile);
  let raw: string;
  try {
    raw = readFileSync(inputPath, "utf-8");
  } catch {
    console.error(`Error: Could not read file "${inputPath}"`);
    process.exit(1);
  }

  let broadcast: BroadcastFile;
  try {
    broadcast = JSON.parse(raw);
  } catch {
    console.error(`Error: "${inputPath}" is not valid JSON`);
    process.exit(1);
  }

  if (!broadcast.transactions || !Array.isArray(broadcast.transactions)) {
    console.error(
      `Error: "${inputPath}" does not look like a Foundry broadcast file (missing transactions array)`,
    );
    process.exit(1);
  }

  try {
    const safe = convertBroadcastToSafe(broadcast);
    const output = JSON.stringify(safe, null, 2) + "\n";

    if (useStdout) {
      process.stdout.write(output);
    } else {
      const outPath = outputFile
        ? resolve(outputFile)
        : defaultOutputPath(inputPath);
      writeFileSync(outPath, output);
      console.log(
        `Converted ${safe.transactions.length} transaction(s) for chain ${safe.chainId}`,
      );
      console.log(`Written to ${outPath}`);
    }
  } catch (err) {
    if (err instanceof AggregateError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

main();
