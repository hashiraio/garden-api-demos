import { createOrder, isBTCOrder } from "./create-order";
import { getQuote } from "./quote";

async function btcToEvmSwap() {
  try {
    console.log("Starting BTC to Arbitrum USDC swap\n");

    console.log("Step 1: Getting quote\n");

    const quotes = await getQuote(
      "bitcoin_testnet:btc",
      "arbitrum_sepolia:usdc",
      "50000"
    );

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
      "tb1qzy4wc2kghm0w6kxy2243wwx5kdv2r06zrz235z", // Your bitcoin address
      "0x5A6A32dE366b917A594342B28530d53708f2881c" // Your arbitrum address
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
