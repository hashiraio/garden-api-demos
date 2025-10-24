import { ethers } from "ethers";
import type { EVMOrder, EVMTransaction } from "./create-order";
import { parseEnv } from "./parseEnv";

import { Effect } from "effect";
import { addHexPrefix, TronHTLC, type HTLCSwap } from "tron-htlc";
import { TronWeb } from "tronweb";

const EVM_PRIVATE_KEY = parseEnv(
  process.env.EVM_PRIVATE_KEY,
  "EVM_PRIVATE_KEY"
);

const TRON_RPC_URL = parseEnv(process.env.TRON_RPC_URL, "TRON_RPC_URL");

const TRON_PRIVATE_KEY = parseEnv(
  process.env.TRON_PRIVATE_KEY,
  "TRON_PRIVATE_KEY"
);

const API_BASE_URL = parseEnv(process.env.GARDEN_API_URL, "GARDEN_API_URL");
const API_KEY = parseEnv(process.env.GARDEN_API_KEY, "GARDEN_API_KEY");

const RPC_URLS: Record<number, string> = {
  42161: "https://arb1.arbitrum.io/rpc",
  421614: "https://sepolia-rollup.arbitrum.io/rpc",
};

export async function submitTransaction(
  transaction: EVMTransaction,
  waitForConfirmation: boolean = true
): Promise<string> {
  const rpcUrl = RPC_URLS[transaction.chain_id];
  if (!rpcUrl) {
    throw new Error(`No RPC URL for chain ${transaction.chain_id}`);
  }

  console.log(` [TRANSACTION] Connecting to chain ${transaction.chain_id}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(EVM_PRIVATE_KEY, provider);

  console.log(` [TRANSACTION] Submitting transaction from ${wallet.address}`);

  const tx = await wallet.sendTransaction({
    to: transaction.to,
    data: transaction.data,
    gasLimit: transaction.gas_limit,
    value: transaction.value,
  });

  console.log(` [TRANSACTION] Transaction hash: ${tx.hash}`);

  if (waitForConfirmation) {
    console.log(" [TRANSACTION] Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(` [TRANSACTION] Confirmed in block ${receipt?.blockNumber}`);
  }

  return tx.hash;
}

export async function initiateViaRelayer(
  order: EVMOrder,
  chainType: string
): Promise<string> {
  const signature =
    chainType === "EVM"
      ? await getEvmInitiateSignature(order)
      : await getTronInitiateSignature(order);

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

  console.log(` [RELAYER] Transaction hash: ${data.result}`);

  return data.result;
}

async function getEvmInitiateSignature(order: EVMOrder): Promise<string> {
  if (!order.typed_data) {
    throw new Error("Order does not support relayer (no typed_data)");
  }

  const wallet = new ethers.Wallet(EVM_PRIVATE_KEY);

  const signature = await wallet.signTypedData(
    order.typed_data.domain,
    {
      [order.typed_data.primaryType]:
        order.typed_data.types[order.typed_data.primaryType] || [],
    },
    order.typed_data.message
  );

  return signature;
}

export async function getTronInitiateSignature(
  order: EVMOrder
): Promise<string> {
  if (!order.typed_data) {
    throw new Error("Order does not support relayer (no typed_data)");
  }

  const htlcContract = new TronHTLC(
    new TronWeb({ privateKey: TRON_PRIVATE_KEY, fullHost: TRON_RPC_URL })
  );

  let swap: HTLCSwap = {
    amount: BigInt(order.typed_data.message.amount),
    initiator: "",
    redeemer: order.typed_data.message.redeemer,
    secret_hash: order.typed_data.message.secretHash,
    order_id: addHexPrefix(order.order_id),
    timelock: Number(BigInt(order.typed_data.message.timelock)),
    destination_data: "0x",
  };

  const signature = await Effect.runPromise(
    htlcContract.getInitiateSignature(
      swap,
      order.typed_data.domain.verifyingContract
    )
  );

  return signature;
}
