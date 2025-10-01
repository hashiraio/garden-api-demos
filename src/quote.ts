const API_BASE_URL = process.env.GARDEN_API_URL || "https://api.garden.finance";

export interface Asset {
  asset: string;
  amount: string;
  display: string;
  value: string;
}

export interface Quote {
  solver_id: string;
  estimated_time: number;
  source: Asset;
  destination: Asset;
  slippage: number;
}

interface QuoteResponse {
  status: "Ok" | "Error";
  error: string | null;
  result: Quote[];
}

export async function getQuote(
  fromAsset: string,
  toAsset: string,
  fromAmount: string
): Promise<Quote[]> {
  const url = new URL(`${API_BASE_URL}/v2/quote`);

  url.searchParams.set("from", fromAsset);
  url.searchParams.set("to", toAsset);
  url.searchParams.set("from_amount", fromAmount);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = (await response.json()) as QuoteResponse;

  if (data.status === "Error") {
    throw new Error(data.error || "API error");
  }

  return data.result;
}
