import { runMultipleSwaps as runEvmToTronSwap } from "./evm-to-tron";
import { parseEnv } from "./parseEnv";

import { runMultipleSwaps as runTronToEvmSwap } from "./tron-to-evm";

const INTERVAL = parseInt(parseEnv(process.env.INTERVAL));

// Global counters
let totalSwapsExecuted = 0;
let tronToEvmCount = 0;
let evmToTronCount = 0;
let cycleCount = 0;

// Main scheduler function
async function runScheduledSwaps() {
  console.log("Starting scheduled swap service...");
  console.log("Running swaps every 1 minute");
  console.log("Each cycle will run: TRON→EVM and EVM→TRON swaps");
  console.log("Counters: Total=0, TRON→EVM=0, EVM→TRON=0, Cycles=0\n");

  // Run immediately on startup
  console.log("=== Initial Run ===");
  cycleCount++;
  console.log(`CYCLE #${cycleCount} - Starting initial run`);

  console.log(
    `\nSWAP #${++totalSwapsExecuted} - TRON→EVM (Total TRON→EVM: ${++tronToEvmCount})`
  );
  await runTronToEvmSwap();

  console.log(
    `\nSWAP #${++totalSwapsExecuted} - EVM→TRON (Total EVM→TRON: ${++evmToTronCount})`
  );
  await runEvmToTronSwap();

  console.log("=== Initial Run Complete ===");
  console.log(
    `\n*** METRICS *** Current Stats: Total=${totalSwapsExecuted}, TRON→EVM=${tronToEvmCount}, EVM→TRON=${evmToTronCount}, Cycles=${cycleCount}\n`
  );

  // Set up interval to run every 10 seconds
  setInterval(async () => {
    cycleCount++;
    console.log(`\n${new Date().toISOString()} - CYCLE #${cycleCount}`);
    console.log("=".repeat(60));

    console.log(
      `\nSWAP #${++totalSwapsExecuted} - TRON→EVM (Total TRON→EVM: ${++tronToEvmCount})`
    );
    await runTronToEvmSwap();

    console.log(
      `\nSWAP #${++totalSwapsExecuted} - EVM→TRON (Total EVM→TRON: ${++evmToTronCount})`
    );
    await runEvmToTronSwap();

    console.log("=".repeat(60));
    console.log(`*** CYCLE COMPLETED *** CYCLE #${cycleCount} COMPLETED`);
    console.log(
      `\n*** METRICS *** Current Stats: Total=${totalSwapsExecuted}, TRON→EVM=${tronToEvmCount}, EVM→TRON=${evmToTronCount}, Cycles=${cycleCount}\n`
    );
  }, INTERVAL); // 2 minutes
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

// Start the scheduler
runScheduledSwaps().catch((error) => {
  console.error("Fatal error in scheduler:", error);
  process.exit(1);
});
