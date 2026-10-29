# FundChain — GDG Web3 Task 1

All-or-nothing crowdfunding on **Sepolia**.

- Creators open a campaign with a **goal** and a **deadline**.
- Anyone can **contribute** test ETH while it is open.
- After the deadline: the creator **withdraws** if the goal was met; otherwise each contributor **refunds** themselves.

## What you need

1. [Node.js](https://nodejs.org/) 18+
2. [MetaMask](https://metamask.io/) with the **Sepolia** network
3. A little Sepolia ETH from a faucet (for example [Google Cloud Web3 faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia))
4. An RPC URL (Alchemy / Infura / `https://rpc.sepolia.org`)

## Setup

```bash
npm install
copy .env.example .env
```

Edit `.env`:

- `SEPOLIA_RPC_URL` — your RPC
- `PRIVATE_KEY` — MetaMask account private key (Account details → Show private key). Never share this file.

## Compile, test, deploy

```bash
npm run compile
npm test
npm run deploy:sepolia
```

Copy the printed address into `index.html`:

```js
const CONTRACT_ADDRESS = "0x...";
```

## Run the frontend

```bash
npm run frontend
```

Open http://localhost:5173, click **Connect wallet**, approve Sepolia, then create a campaign.

For a quick demo, set the duration to **2 minutes**, contribute from a second wallet (or the same one), wait for it to end, then **Withdraw** or **Refund**.

## Contract functions (matches the brief)

| Function | What it does |
|---|---|
| `createCampaign(title, description, goal, durationInMinutes)` | Opens a campaign |
| `contribute(campaignId)` payable | Sends ETH while the campaign is open |
| `withdrawFunds(campaignId)` | Creator pulls funds after a successful deadline |
| `refund(campaignId)` | Contributor pulls their ETH after a failed deadline |
| `getAllCampaigns()` | Used by the UI to list progress and time left |

Campaign states in the UI:

- **Active** → Contribute
- **Goal reached** (ended) → Withdraw (creator only)
- **Goal missed** (ended) → Refund (your contribution)

## Safety notes (good talking points in an interview)

- State is updated **before** ETH is sent (reentrancy).
- Refunds are **pull** (each person claims their own amount).
- Withdraw is **creator-only** and only after the deadline if `totalRaised >= goal`.
