# Garden Finance API Integration

API integration examples for Garden Finance cross-chain swaps.

## Setup

Install dependencies:

```bash
bun install
```

### Environment Configuration

Create a `.env` file in the project root with the following:

```env
GARDEN_API_KEY=your_api_key_here
BTC_ADDRESS=your_bitcoin_address
EVM_ADDRESS=your_evm_address
EVM_PRIVATE_KEY=your_evm_private_key
GARDEN_API_URL=https://api.garden.finance
GASLESS=true
```

## Usage

### BTC to EVM Swap

Swap Bitcoin to USDC on Arbitrum.

```bash
bun run src/btc-to-evm.ts
```

**Flow:**

1. Get quote for swap
2. Create order
3. Send Bitcoin to provided address

### EVM to BTC Swap

Swap USDC on Arbitrum to Bitcoin.

```bash
bun run src/evm-to-btc.ts
```

**Flow:**

1. Get quote for swap
2. Create order
3. Submit approval transaction (if needed)
4. Submit initiate transaction via relayer

## API Functions

### Get Quote

```typescript
import { getQuote } from "./quote";

const quotes = await getQuote(
  "bitcoin:btc",
  "arbitrum:usdc",
  "100000" // Amount in smallest unit
);
```

### Create Order

```typescript
import { createOrder } from "./create-order";

const order = await createOrder(quote, sourceAddress, destinationAddress);
```

### Submit Transaction

```typescript
import { submitTransaction } from "./initiate";

const txHash = await submitTransaction(transaction);
```

### Initiate via Relayer

```typescript
import { initiateViaRelayer } from "./initiate";

const txHash = await initiateViaRelayer(order);
```

## Asset Format

Assets are specified as `chain:token`:

- Bitcoin: `bitcoin:btc`
- Arbitrum USDC: `arbitrum:usdc`
- Ethereum WBTC: `ethereum:wbtc`

Amounts must be in the smallest unit:

- Bitcoin: satoshis (1 BTC = 100,000,000)
- USDC: micro-units (1 USDC = 1,000,000)
- ETH: wei (1 ETH = 10^18)

## Resources

- [Garden Finance Docs](https://docs.garden.finance)
