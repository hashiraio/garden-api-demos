import { createOrder, isEVMOrder } from "./create-order";
import { submitTransaction } from "./initiate";
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
      "0x5A6A32dE366b917A594342B28530d53708f2881c",
      "bc1qzy4wc2kghm0w6kxy2243wwx5kdv2r06zfy3z03"
    );

    console.log("Order created");
    console.log(`Order ID: ${order.order_id}\n`);

    if (isEVMOrder(order)) {
      console.log("Step 3: Submitting transactions\n");

      if (order.approval_transaction) {
        console.log("Submitting approval transaction");
        await submitTransaction(order.approval_transaction);
        console.log();
      }

      // You have two options to initiate the swap:
      // 1. Submit the initiate transaction directly to the blockchain using the provided transaction data.
      // 2. Use the relayer service to handle the transaction for you (recommended for simplicity).
      // We'll proceed with the relayer approach below.

      // console.log("Initiating swap via relayer");
      // const txHash1 = await initiateViaRelayer(order);
      // console.log(`Transaction Hash: ${txHash1}`);

      // or

      // console.log("Initiate transaction");
      // const txHash2 = await submitTransaction(order.initiate_transaction);
      // console.log(`Transaction hash: ${txHash2}`);

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
