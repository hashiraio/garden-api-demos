import { createOrder, isEVMOrder } from "./create-order";
import { initiateViaRelayer, submitTransaction } from "./initiate";
import { parseEnv } from "./parseEnv";
import { getQuote } from "./quote";

async function createOrderForSwap() {
  console.log(" [TRON→EVM] Getting quote for TRON USDT → Arbitrum WBTC...");

  const quotes = await getQuote(
    "tron_shasta:usdt",
    "arbitrum_sepolia:wbtc",
    "10000000"
  );

  if (!quotes || quotes.length === 0) {
    throw new Error(" [TRON→EVM] No quotes available");
  }

  const quote = quotes[0]!;
  console.log(" [TRON→EVM] Quote received successfully");
  console.log(` [TRON→EVM] Solver: ${quote.solver_id}`);
  console.log(
    ` [TRON→EVM] Send: ${quote.source.display} USDT ($${quote.source.value})`
  );
  console.log(
    ` [TRON→EVM] Receive: ${quote.destination.display} WBTC ($${quote.destination.value})`
  );
  console.log(`  [TRON→EVM] Estimated time: ${quote.estimated_time} seconds`);
  console.log(` [TRON→EVM] Slippage: ${quote.slippage / 100}%\n`);

  console.log(" [TRON→EVM] Creating order...");

  const order = await createOrder(
    quote,
    parseEnv(process.env.TRON_ADDRESS, "TRON_ADDRESS"),
    parseEnv(process.env.EVM_ADDRESS, "EVM_ADDRESS")
  );

  console.log(" [TRON→EVM] Order created successfully");
  console.log(` [TRON→EVM] Order ID: ${order.order_id}\n`);

  return { order, quote };
}

export async function runMultipleSwaps() {
  const iterations = 1;

  console.log(
    ` [TRON→EVM] Starting TRON to EVM swap process (${iterations} iteration)\n`
  );

  // Step 1: Create all orders
  console.log(" [TRON→EVM] === Step 1: Creating orders ===");
  const ordersAndQuotes = [];

  for (let i = 1; i <= iterations; i++) {
    console.log(` [TRON→EVM] Creating order ${i}/${iterations}`);

    try {
      const { order, quote } = await createOrderForSwap();
      ordersAndQuotes.push({ order, quote, index: i });
      console.log(` [TRON→EVM] Order ${i} created successfully\n`);
    } catch (error) {
      console.error(` [TRON→EVM] Order ${i} creation failed:`, error);
      console.log(`  [TRON→EVM] Continuing with next order...\n`);
    }

    // Small delay between order creation to avoid rate limiting
    if (i < iterations) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    ` [TRON→EVM] Created ${ordersAndQuotes.length} orders successfully\n`
  );

  // Step 2: Initiate all orders via relayer
  console.log(" [TRON→EVM] === Step 2: Initiating orders via relayer ===");

  for (const { order, quote, index } of ordersAndQuotes) {
    console.log(
      ` [TRON→EVM] Initiating order ${index}/${ordersAndQuotes.length}`
    );

    try {
      if (isEVMOrder(order)) {
        if (order.approval_transaction) {
          console.log(" [TRON→EVM] Submitting approval transaction...");
          await submitTransaction(order.approval_transaction);
          console.log(" [TRON→EVM] Approval transaction submitted");
        }

        console.log(" [TRON→EVM] Initiating swap via relayer...");
        await initiateViaRelayer(order, "TRON");
        console.log(" [TRON→EVM] Swap initiated successfully");

        console.log(
          `  [TRON→EVM] Order ${index} will complete in approximately ${quote.estimated_time} seconds\n`
        );
      }
    } catch (error) {
      console.error(` [TRON→EVM] Order ${index} initiation failed:`, error);
      console.log(`  [TRON→EVM] Continuing with next order...\n`);
    }

    // Small delay between initiations
    if (index < ordersAndQuotes.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(" [TRON→EVM] All TRON to EVM orders initiated successfully");
}

// runMultipleSwaps(); // Commented out to allow importing
