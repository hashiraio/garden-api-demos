import { createOrder, isEVMOrder } from "./create-order";
import { initiateViaRelayer, submitTransaction } from "./initiate";
import { parseEnv } from "./parseEnv";
import { getQuote } from "./quote";

async function createOrderForSwap() {
  console.log(" [EVM→TRON] Getting quote for Arbitrum WBTC → TRON USDT...");

  const quotes = await getQuote(
    "arbitrum_sepolia:wbtc",
    "tron_shasta:usdt",
    "10000"
  );

  if (!quotes || quotes.length === 0) {
    throw new Error(" [EVM→TRON] No quotes available");
  }

  const quote = quotes[0]!;
  console.log(" [EVM→TRON] Quote received successfully");
  console.log(` [EVM→TRON] Solver: ${quote.solver_id}`);
  console.log(
    ` [EVM→TRON] Send: ${quote.source.display} WBTC ($${quote.source.value})`
  );
  console.log(
    ` [EVM→TRON] Receive: ${quote.destination.display} USDT ($${quote.destination.value})`
  );
  console.log(`  [EVM→TRON] Estimated time: ${quote.estimated_time} seconds`);
  console.log(` [EVM→TRON] Slippage: ${quote.slippage / 100}%\n`);

  console.log(" [EVM→TRON] Creating order...");

  const order = await createOrder(
    quote,
    parseEnv(process.env.EVM_ADDRESS, "EVM_ADDRESS"),
    parseEnv(process.env.TRON_ADDRESS, "TRON_ADDRESS")
  );

  console.log(" [EVM→TRON] Order created successfully");
  console.log(` [EVM→TRON] Order ID: ${order.order_id}\n`);

  return { order, quote };
}

export async function runMultipleSwaps() {
  const iterations = 1;

  console.log(
    ` [EVM→TRON] Starting EVM to TRON swap process (${iterations} iteration)\n`
  );

  // Step 1: Create all orders
  console.log(" [EVM→TRON] === Step 1: Creating orders ===");
  const ordersAndQuotes = [];

  for (let i = 1; i <= iterations; i++) {
    console.log(` [EVM→TRON] Creating order ${i}/${iterations}`);

    try {
      const { order, quote } = await createOrderForSwap();
      ordersAndQuotes.push({ order, quote, index: i });
      console.log(` [EVM→TRON] Order ${i} created successfully\n`);
    } catch (error) {
      console.error(` [EVM→TRON] Order ${i} creation failed:`, error);
      console.log(`  [EVM→TRON] Continuing with next order...\n`);
    }

    // Small delay between order creation to avoid rate limiting
    if (i < iterations) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    ` [EVM→TRON] Created ${ordersAndQuotes.length} orders successfully\n`
  );

  // Step 2: Initiate all orders via relayer
  console.log(" [EVM→TRON] === Step 2: Initiating orders via relayer ===");

  for (const { order, quote, index } of ordersAndQuotes) {
    console.log(
      ` [EVM→TRON] Initiating order ${index}/${ordersAndQuotes.length}`
    );

    try {
      if (isEVMOrder(order)) {
        if (order.approval_transaction) {
          console.log(" [EVM→TRON] Submitting approval transaction...");
          await submitTransaction(order.approval_transaction);
          console.log(" [EVM→TRON] Approval transaction submitted");
        }

        if (process.env.GASLESS === "true") {
          console.log(" [EVM→TRON] Initiating swap via relayer...");
          await initiateViaRelayer(order, "EVM");
          console.log(" [EVM→TRON] Swap initiated via relayer");
        } else {
          console.log(" [EVM→TRON] Initiating transaction by submitting...");
          await submitTransaction(order.initiate_transaction);
          console.log(" [EVM→TRON] Transaction submitted");
        }

        console.log(
          `  [EVM→TRON] Order ${index} will complete in approximately ${quote.estimated_time} seconds\n`
        );
      }
    } catch (error) {
      console.error(` [EVM→TRON] Order ${index} initiation failed:`, error);
      console.log(`  [EVM→TRON] Continuing with next order...\n`);
    }

    // Small delay between initiations
    if (index < ordersAndQuotes.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(" [EVM→TRON] All EVM to TRON orders initiated successfully");
}

// runMultipleSwaps(); // Commented out to allow importing
