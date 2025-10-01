import { parseEnv } from "./parseEnv";
import type { Quote } from "./quote";

const API_BASE_URL = parseEnv(process.env.GARDEN_API_URL, "GARDEN_API_URL");
const API_KEY = parseEnv(process.env.GARDEN_API_KEY, "GARDEN_API_KEY");

export interface OrderAsset {
  asset: string;
  owner: string;
  amount: string;
}

export interface EVMTransaction {
  chain_id: number;
  data: string;
  gas_limit: string;
  to: string;
  value: string;
}

export interface TypedData {
  domain: {
    chainId: string;
    name: string;
    verifyingContract: string;
    version: string;
  };
  message: {
    amount: string;
    redeemer: string;
    secretHash: string;
    timelock: string;
  };
  primaryType: string;
  types: Record<string, Array<{ name: string; type: string }>>;
}

export interface BTCOrder {
  order_id: string;
  to: string;
  amount: number;
}

export interface EVMOrder {
  order_id: string;
  approval_transaction?: EVMTransaction;
  initiate_transaction: EVMTransaction;
  typed_data?: TypedData;
}

export type Order = BTCOrder | EVMOrder;

interface CreateOrderResponse {
  status: "Ok" | "Error";
  error: string | null;
  result: Order;
}

export async function createOrder(
  quote: Quote,
  sourceAddress: string,
  destinationAddress: string
): Promise<Order> {
  const requestBody = {
    source: {
      asset: quote.source.asset,
      owner: sourceAddress,
      amount: quote.source.amount,
    },
    destination: {
      asset: quote.destination.asset,
      owner: destinationAddress,
      amount: quote.destination.amount,
    },
  };

  const response = await fetch(`${API_BASE_URL}/v2/orders`, {
    method: "POST",
    headers: {
      "garden-app-id": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = (await response.json()) as CreateOrderResponse;

  if (data.status === "Error") {
    throw new Error(data.error || "API error");
  }

  return data.result;
}

export function isEVMOrder(order: Order): order is EVMOrder {
  return "initiate_transaction" in order;
}

export function isBTCOrder(order: Order): order is BTCOrder {
  return (
    "to" in order && "amount" in order && !("initiate_transaction" in order)
  );
}
