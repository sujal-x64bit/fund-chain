# FundChain — Decentralized Crowdfunding on Sepolia

**FundChain** is an all-or-nothing crowdfunding decentralized application (dApp) deployed on the **Ethereum Sepolia testnet**. It allows project creators to raise test ETH with transparent, immutable rules enforced by a smart contract.

If a campaign reaches its funding goal before the deadline expires, the creator can withdraw the entire pot. If the goal is missed, all contributors can claim a 100% refund of their contributions directly from the smart contract.

---

## 💡 How It Works

```
                     ┌──────────────────────────────┐
                     │ Creator Launches a Campaign  │
                     │  (Goal + Duration in Mins)   │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │ Contributors Send Test ETH│
                      │  (Before Deadline Hits)   │
                      └─────────────┬─────────────┘
                                    │
                     [ Has Deadline Passed? ]
                            /               \
                       YES /                 \ NO
                          /                   \
                         ▼                     ▼
          [ Was Goal Reached? ]       [ Still Active: Continue ]
               /             \        [ Receiving Contributions]
          YES /               \ NO
             ▼                 ▼
   ┌─────────────────┐  ┌─────────────────────────┐
   │ Creator Claims  │  │ Contributors Can Claim  │
   │ Full Pot Funds  │  │ 100% Refund of Their ETH│
   └─────────────────┘  └─────────────────────────┘
```

1. **Campaign Creation**: A creator sets a campaign title, description, target funding goal (in ETH), and a duration in minutes.
2. **Contributions**: Anyone with Sepolia test ETH can contribute any amount while the campaign remains active.
3. **Outcome Resolution**:
   - **Successful Campaign**: If `totalRaised >= goal` when the deadline is reached, the creator can call `withdrawFunds` to transfer all raised ETH to their wallet.
   - **Unsuccessful Campaign**: If `totalRaised < goal` after the deadline, each contributor can call `refund` to retrieve their full deposited amount.

---

## 📜 Smart Contract Specification

The smart contract is written in Solidity `^0.8.20` and implemented in [`contracts/FundChain.sol`](contracts/FundChain.sol).

### Campaign Lifecycle & States

| State | Condition | Available Actions |
|---|---|---|
| **Active** | `block.timestamp < deadline` | Anyone can contribute ETH via `contribute()` |
| **Successful** | `block.timestamp >= deadline && totalRaised >= goal` | Creator can call `withdrawFunds()`; contributions are locked |
| **Failed** | `block.timestamp >= deadline && totalRaised < goal` | Contributors can call `refund()` to retrieve their ETH |

---

## 📁 Project Structure

```text
fundchain-mvp1/
├── contracts/
│   └── FundChain.sol          # Solidity smart contract
├── scripts/
│   └── deploy.js              # Hardhat deployment script for Sepolia
├── test/
│   └── FundChain.js           # Automated test suite (5 passing test cases)
├── .env.example               # Template environment configuration file
├── .gitignore                 # Git ignore configuration
├── deployed-address.txt       # Logged address of the deployed contract
├── hardhat.config.js          # Hardhat configuration (Solidity 0.8.20 & networks)
├── index.html                 # Complete single-page frontend application
├── package.json               # Project metadata, dependencies, and npm scripts
└── README.md                  # Project documentation
```

---

## 🧰 Prerequisites

Make sure you have the following installed and set up:

1. **[Node.js](https://nodejs.org/)** (v18.0.0 or higher) and `npm`.
2. **[MetaMask](https://metamask.io/)** extension installed in your web browser.
3. **Sepolia Test ETH**: Obtain free testnet ETH from any reputable faucet:
   - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
4. **Sepolia RPC Endpoint**: An RPC provider URL from [Alchemy](https://www.alchemy.com/), [Infura](https://www.infura.io/), or public endpoints such as `https://rpc.sepolia.org`.

---

## 🚀 Installation & Setup

1. **Clone or navigate to the repository:**
   ```bash
   cd dvote
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to create your local `.env`:
   - On Windows (PowerShell / Command Prompt):
     ```bash
     copy .env.example .env
     ```
   - On Linux / macOS:
     ```bash
     cp .env.example .env
     ```

4. **Edit `.env` with your credentials:**
   ```env
   SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
   PRIVATE_KEY="your_wallet_private_key_without_0x_prefix"
   ```
   > [!WARNING]
   > Never commit `.env` or reveal your private key. Use a dedicated development wallet containing only testnet funds.

---

## 🧪 Compile, Test & Deploy

### 1. Compile Contracts
Compile the Solidity smart contract using Hardhat:
```bash
npm run compile
```

### 2. Run Automated Tests
Execute the unit test suite with Hardhat's built-in testing network:
```bash
npm test
```
The test suite in [`test/FundChain.js`](test/FundChain.js) asserts:
- Campaign creation and accurate list retrieval.
- Active contribution tracking and mapping accuracy.
- Successful goal completion and creator fund withdrawal.
- Missed goal scenario with 100% contributor refund claim.
- Security boundary enforcement (blocking withdraw if goal missed, blocking refund if goal met).

### 3. Deploy to Sepolia
Deploy a fresh instance to the Sepolia testnet:
```bash
npm run deploy:sepolia
```
Upon completion:
- The deployed contract address is displayed in your terminal.
- The address is automatically saved to `deployed-address.txt`.
- If you deploy a new instance, update `CONTRACT_ADDRESS` at line 889 in `index.html`:
  ```javascript
  const CONTRACT_ADDRESS = "0xYourNewContractAddress";
  ```

---

## 💻 Running the Frontend

Start the local web server:
```bash
npm run frontend
```

1. Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.
2. Click **Connect wallet** to connect MetaMask.
3. The app will automatically prompt you to switch to the **Sepolia Test Network** if you are connected to a different network.

---

## ⏱️ Quick Demo Walkthrough

To test both outcomes in a few minutes:

### Scenario A: Successful Goal & Creator Withdrawal
1. Connect Wallet **A** (Creator).
2. Click **New campaign**.
   - Title: `Community Tech Library`
   - Goal: `0.02 ETH`
   - Duration: Click the `2m (Demo)` preset button.
3. Submit and confirm the transaction in MetaMask.
4. Switch to Wallet **B** (Contributor) in MetaMask (or use the same wallet).
5. Contribute `0.02 ETH` to the campaign.
6. Wait for the 2-minute timer to finish.
7. Switch back to Wallet **A** (Creator). The action panel will display **Withdraw the pot**.
8. Click **Withdraw** and confirm the transaction to claim the total raised ETH.

### Scenario B: Missed Goal & Contributor Refund
1. With Wallet **A**, create a new campaign:
   - Goal: `1.0 ETH`
   - Duration: `2m (Demo)`
2. With Wallet **B**, contribute `0.01 ETH`.
3. Wait for the 2-minute duration to expire.
4. Because the total raised (`0.01 ETH`) is less than the goal (`1.0 ETH`), the status changes to **Failed**.
5. Wallet **B** will see the **Claim full refund** button.
6. Click **Claim full refund** to pull the `0.01 ETH` back into Wallet **B**.

---

## 🛡️ Security & Best Practices

- **Zero Platform Fees**: 100% of contributed funds go directly to either the creator (on goal met) or back to contributors (on goal missed).
- **Checks-Effects-Interactions (CEI)** pattern eliminates reentrancy vectors.
- **Explicit Access Controls**: Strict `require` checks ensure that only the campaign creator can withdraw funds and only valid contributors can request refunds.
- **Fail-Safe Refunds**: In case a project does not meet its target, contributors retain cryptographic ownership and pull rights over their deposited assets.

