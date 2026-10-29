# FundChain — Decentralized Crowdfunding on Sepolia

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.17-yellow?logo=ethereum)](https://hardhat.org/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0)](https://docs.ethers.org/v6/)
[![Network](https://img.shields.io/badge/Network-Sepolia%20Testnet-blue)](https://sepolia.etherscan.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**FundChain** is an all-or-nothing crowdfunding decentralized application (dApp) deployed on the **Ethereum Sepolia testnet**. It allows project creators to raise test ETH with transparent, immutable rules enforced by a smart contract.

If a campaign reaches its funding goal before the deadline expires, the creator can withdraw the entire pot. If the goal is missed, all contributors can claim a 100% refund of their contributions directly from the smart contract.

---

## 📌 Table of Contents

- [Live Deployment](#-live-deployment)
- [How It Works](#-how-it-works)
- [Key Features](#-key-features)
- [Smart Contract Specification](#-smart-contract-specification)
  - [Campaign Lifecycle & States](#campaign-lifecycle--states)
  - [Methods & Interface](#methods--interface)
  - [Security & Design Patterns](#security--design-patterns)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Compile, Test & Deploy](#-compile-test--deploy)
  - [Compile Contracts](#1-compile-contracts)
  - [Run Automated Tests](#2-run-automated-tests)
  - [Deploy to Sepolia](#3-deploy-to-sepolia)
- [Running the Frontend](#-running-the-frontend)
- [Quick Demo Walkthrough](#-quick-demo-walkthrough)
- [Security & Best Practices](#-security--best-practices)
- [License](#-license)

---

## 🌐 Live Deployment

| Parameter | Value |
|---|---|
| **Network** | Ethereum Sepolia Testnet |
| **Chain ID** | `11155111` (`0xaa36a7`) |
| **Contract Address** | [`0x4237bDb0AEB119521859dEa7088AA09dE0500f1D`](https://sepolia.etherscan.io/address/0x4237bDb0AEB119521859dEa7088AA09dE0500f1D) |
| **Block Explorer** | [Sepolia Etherscan Contract View](https://sepolia.etherscan.io/address/0x4237bDb0AEB119521859dEa7088AA09dE0500f1D) |

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

## ✨ Key Features

### 🖥️ Modern Web3 Frontend
- **Zero-framework footprint**: Built with lightweight, pure semantic HTML5, CSS3 variables, and vanilla JavaScript powered by **Ethers.js v6**.
- **Dark & Light Modes**: Seamless visual themes with persistent preference storage in `localStorage`.
- **MetaMask Wallet Integration**: One-click wallet connect, automatic Sepolia network detection, balance updates, and account switching.
- **Interactive Demo Mode**: Explore the full crowdfunding dashboard and test flows even without a Web3 extension or test ETH.
- **Filter Tabs & Search**: Filter campaigns by `All`, `Active`, `Successful`, `Failed`, or `My campaigns`, plus real-time keyword search across titles and descriptions.
- **Duration Presets & Quick Chips**: Preset buttons for 2 min (quick testing), 15 min, 1 hr, 1 day, and 7 days, along with quick contribution increment buttons (`+0.01`, `+0.05`, `+0.10 ETH`).
- **Live State & Counters**: Real-time progress bars, time-remaining countdowns, and dynamic action buttons based on the connected wallet's relationship to each campaign (creator vs contributor).
- **Transaction Feedback**: Informative modal overlays indicating MetaMask signing states and blockchain mining confirmations, accompanied by auto-dismissing toast notifications.

---

## 📜 Smart Contract Specification

The smart contract is written in Solidity `^0.8.20` and implemented in [`contracts/FundChain.sol`](contracts/FundChain.sol).

### Campaign Lifecycle & States

| State | Condition | Available Actions |
|---|---|---|
| **Active** | `block.timestamp < deadline` | Anyone can contribute ETH via `contribute()` |
| **Successful** | `block.timestamp >= deadline && totalRaised >= goal` | Creator can call `withdrawFunds()`; contributions are locked |
| **Failed** | `block.timestamp >= deadline && totalRaised < goal` | Contributors can call `refund()` to retrieve their ETH |

### Methods & Interface

#### Write Methods
- `createCampaign(string title, string description, uint256 goal, uint256 durationInMinutes) external returns (uint256)`
  - Opens a new campaign with a calculated deadline of `block.timestamp + durationInMinutes * 1 minutes`.
  - Emits `CampaignCreated(uint256 indexed id, address indexed creator, uint256 goal, uint256 deadline)`.
- `contribute(uint256 campaignId) external payable`
  - Accepts test ETH for an active campaign before its deadline.
  - Updates campaign total and maps individual contributor contributions.
  - Emits `Contributed(uint256 indexed id, address indexed contributor, uint256 amount)`.
- `withdrawFunds(uint256 campaignId) external`
  - Allows only the campaign creator to withdraw the entire pot after a successful campaign has ended.
  - Emits `Withdrawn(uint256 indexed id, address indexed creator, uint256 amount)`.
- `refund(uint256 campaignId) external`
  - Allows contributors to claim back their contributed ETH after a campaign ends without reaching its goal.
  - Emits `Refunded(uint256 indexed id, address indexed contributor, uint256 amount)`.

#### View Methods
- `getAllCampaigns() external view returns (Campaign[] memory)`
  - Returns an array containing all created campaigns for easy client-side listing and rendering.
- `getCampaignCount() external view returns (uint256)`
  - Returns the total number of campaigns created.
- `contributions(uint256 campaignId, address contributor) external view returns (uint256)`
  - Public mapping returning the exact amount in wei contributed by an address to a campaign.

### Security & Design Patterns
- **Checks-Effects-Interactions (CEI)**: State variables (`c.withdrawn = true`, `contributions[campaignId][msg.sender] = 0`) are modified **before** initiating external ETH transfers to prevent reentrancy attacks.
- **Pull over Push Payments**: Contributors pull their own refunds and creators pull their own funds rather than looping through recipient arrays (mitigates denial-of-service / gas limit attacks).
- **Strict Validations**: Reverts with clear error messages for invalid inputs, zero-amount contributions, non-existent campaigns, and unauthorized calls.

---

## 📁 Project Structure

```text
dvote/
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

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
