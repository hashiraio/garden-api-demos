import { createOrder, isEVMOrder } from "./create-order";
import { initiateViaRelayer, submitTransaction } from "./initiate";
import { parseEnv } from "./parseEnv";
import { getQuote } from "./quote";

async function tronToEvmSwap() {
  try {
    console.log("Starting Tron USDT to EVM swap\n");

    console.log("Step 1: Getting quote\n");

    const quotes = await getQuote(
      "tron_shasta:usdt",
      "arbitrum_sepolia:wbtc",
      "10000000"
    );

    if (!quotes || quotes.length === 0) {
      throw new Error("No quotes available");
    }

    const quote = quotes[0]!;
    console.log("Quote received");
    console.log(`Solver: ${quote.solver_id}`);
    console.log(`Send: ${quote.source.display} USDT ($${quote.source.value})`);
    console.log(
      `Receive: ${quote.destination.display} WBTC ($${quote.destination.value})`
    );
    console.log(`Estimated time: ${quote.estimated_time} seconds`);
    console.log(`Slippage: ${quote.slippage / 100}%\n`);

    console.log("Step 2: Creating order\n");

    const order = await createOrder(
      quote,
      parseEnv(process.env.TRON_ADDRESS, "TRON_ADDRESS"),
      parseEnv(process.env.EVM_ADDRESS, "EVM_ADDRESS")
    );

    console.log("Order created");
    console.log(`Order ID: ${order.order_id}\n`);

    if (isEVMOrder(order)) {
      console.log("Step 3: Submitting transactions\n");

      if (order.approval_transaction) {
        console.log("Submitting approval transaction");
        await submitTransaction(order.approval_transaction);
      }

      if (process.env.GASLESS) {
        console.log("Initiating swap via relayer");
        await initiateViaRelayer(order, "TRON");
      } else {
        console.log("Initiate transaction by submitting.");
        // await submitTransaction(order.initiate_transaction);
      }

      console.log(
        `Swap will complete in approximately ${quote.estimated_time} seconds`
      );
    }

    return order;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function runMultipleSwaps() {
  const iterations = parseInt(process.env.ITERATIONS || "1");

  console.log(`Running ${iterations} swap(s)\n`);

  for (let i = 1; i <= iterations; i++) {
    console.log(`=== Swap ${i}/${iterations} ===\n`);

    try {
      await tronToEvmSwap();
      console.log(`Swap ${i} completed successfully\n`);
    } catch (error) {
      console.error(`Swap ${i} failed:`, error);
      console.log(`Continuing with next swap...\n`);
    }

    // Add a small delay between swaps to avoid rate limiting
    if (i < iterations) {
      console.log("Waiting 2 seconds before next swap...\n");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("All swaps completed");
}

runMultipleSwaps();
