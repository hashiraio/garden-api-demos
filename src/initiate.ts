import { ethers } from "ethers";
import type { EVMOrder, EVMTransaction } from "./create-order";

const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY || "";
const API_BASE_URL = process.env.GARDEN_API_URL || "https://api.garden.finance";
const API_KEY = process.env.GARDEN_API_KEY || "";

const RPC_URLS: Record<number, string> = {
  42161: "https://arb1.arbitrum.io/rpc",
  421614: "https://sepolia-rollup.arbitrum.io/rpc",
};

export async function submitTransaction(
  transaction: EVMTransaction,
  waitForConfirmation: boolean = true
): Promise<string> {
  if (!EVM_PRIVATE_KEY) {
    throw new Error("EVM_PRIVATE_KEY not set");
  }

  const rpcUrl = RPC_URLS[transaction.chain_id];
  if (!rpcUrl) {
    throw new Error(`No RPC URL for chain ${transaction.chain_id}`);
  }

  console.log(`Connecting to chain ${transaction.chain_id}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(EVM_PRIVATE_KEY, provider);

  console.log(`Submitting transaction from ${wallet.address}`);

  const tx = await wallet.sendTransaction({
    to: transaction.to,
    data: transaction.data,
    gasLimit: transaction.gas_limit,
    value: transaction.value,
  });

  console.log(`Transaction hash: ${tx.hash}`);

  if (waitForConfirmation) {
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`Confirmed in block ${receipt?.blockNumber}`);
  }

  return tx.hash;
}

export async function initiateViaRelayer(order: EVMOrder): Promise<string> {
  if (!EVM_PRIVATE_KEY) {
    throw new Error("EVM_PRIVATE_KEY not set");
  }

  if (!order.typed_data) {
    throw new Error("Order does not support relayer (no typed_data)");
  }

  console.log("Signing EIP-712 typed data");

  const wallet = new ethers.Wallet(EVM_PRIVATE_KEY);

  const signature = await wallet.signTypedData(
    order.typed_data.domain,
    {
      [order.typed_data.primaryType]:
        order.typed_data.types[order.typed_data.primaryType] || [],
    },
    order.typed_data.message
  );

  console.log(`Signature: ${signature}`);
  console.log("Submitting to relayer");

  const response = await fetch(
    `${API_BASE_URL}/v2/orders/${order.order_id}?action=initiate`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "garden-app-id": API_KEY,
      },
      body: JSON.stringify({ signature }),
    }
  );

  if (!response.ok) {
    throw new Error(`Relayer error: ${response.status}`);
  }

  const data = (await response.json()) as {
    status: "Ok" | "Error";
    error: string | null;
    result: string;
  };

  if (data.status === "Error") {
    throw new Error(data.error || "Relayer error");
  }

  console.log(`Transaction hash: ${data.result}`);

  return data.result;
}
