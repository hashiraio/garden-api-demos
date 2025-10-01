import { createOrder, isEVMOrder } from "./create-order";
import { initiateViaRelayer, submitTransaction } from "./initiate";
import { getQuote } from "./quote";

async function evmToBtcSwap() {
  try {
    console.log("Starting Arbitrum USDC to BTC swap\n");

    console.log("Step 1: Getting quote\n");

    const quotes = await getQuote("arbitrum:usdc", "bitcoin:btc", "15000000");

    if (!quotes || quotes.length === 0) {
      throw new Error("No quotes available");
    }

    const quote = quotes[0]!;
    console.log("Quote received");
    console.log(`Solver: ${quote.solver_id}`);
    console.log(`Send: ${quote.source.display} USDC ($${quote.source.value})`);
    console.log(
      `Receive: ${quote.destination.display} BTC ($${quote.destination.value})`
    );
    console.log(`Estimated time: ${quote.estimated_time} seconds`);
    console.log(`Slippage: ${quote.slippage / 100}%\n`);

    console.log("Step 2: Creating order\n");

    const order = await createOrder(
      quote,
      process.env.EVM_ADDRESS!,
      process.env.BTC_ADDRESS!
    );

    console.log("Order created");
    console.log(`Order ID: ${order.order_id}\n`);

    if (isEVMOrder(order)) {
      console.log("Step 3: Submitting transactions\n");

      if (order.approval_transaction) {
        console.log("Submitting approval transaction");
        await submitTransaction(order.approval_transaction);
      }

      // You have two options to initiate the swap:
      // 1. Submit the initiate transaction directly to the blockchain using the provided transaction data.
      // 2. Use the relayer service to handle the transaction for you (recommended for simplicity).
      // We'll proceed with the relayer approach below.

      // if GASLESS is set to true, we will use the relayer to initiate the swap
      // otherwise, we will submit the initiate transaction directly to the blockchain
      if (process.env.GASLESS) {
        console.log("Initiating swap via relayer");
        await initiateViaRelayer(order);
      } else {
        console.log("Initiate transaction by submitting.");
        await submitTransaction(order.initiate_transaction);
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

evmToBtcSwap();
