import { createOrder, isBTCOrder } from "./create-order";
import { parseEnv } from "./parseEnv";
import { getQuote } from "./quote";

async function btcToEvmSwap() {
  try {
    console.log("Starting BTC to Arbitrum USDC swap\n");

    console.log("Step 1: Getting quote\n");

    const quotes = await getQuote("bitcoin:btc", "arbitrum:usdc", "50000");

    if (!quotes || quotes.length === 0) {
      throw new Error("No quotes available");
    }

    const quote = quotes[0]!;
    console.log("Quote received");
    console.log(`Solver: ${quote.solver_id}`);
    console.log(`Send: ${quote.source.display} BTC ($${quote.source.value})`);
    console.log(
      `Receive: ${quote.destination.display} USDC ($${quote.destination.value})`
    );
    console.log(`Estimated time: ${quote.estimated_time} seconds`);
    console.log(`Slippage: ${quote.slippage / 100}%\n`);

    console.log("Step 2: Creating order\n");

    const order = await createOrder(
      quote,
      parseEnv(process.env.BTC_ADDRESS, "BTC_ADDRESS"), // Your bitcoin address
      parseEnv(process.env.EVM_ADDRESS, "EVM_ADDRESS") // Your arbitrum address
    );

    console.log("Order created");
    console.log(`Order ID: ${order.order_id}\n`);

    if (isBTCOrder(order)) {
      console.log("Step 3: Send Bitcoin\n");
      console.log(`Send ${order.amount} satoshis to: ${order.to}\n`);
    }

    console.log(
      `After sending, swap will complete in approximately ${quote.estimated_time} seconds`
    );

    return order;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

btcToEvmSwap();
