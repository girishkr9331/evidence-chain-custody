# Smart Contract Deployment Guide

## Issue: Contract Not Deployed Error

If you're seeing errors like:
- `could not decode result data (value="0x")`
- `Contract not deployed at this address`
- `BAD_DATA` errors in console

This means the smart contract is not deployed to your current network.

## Solution: Deploy the Smart Contract

### Option 1: Deploy to Local Hardhat Network (Recommended for Development)

#### Step 1: Start Hardhat Node
```bash
cd blockchain
npx hardhat node
```

This will:
- Start a local Ethereum node on `http://127.0.0.1:8545`
- Create test accounts with ETH
- Keep running in the terminal

#### Step 2: Deploy Contract (in a new terminal)
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

This will:
- Deploy the contract to your local network
- Update `src/contracts/EvidenceChainOfCustody.json` with the new address
- Show the deployed contract address

#### Step 3: Add Hardhat Network to MetaMask

1. Open MetaMask
2. Click on network dropdown (top)
3. Click "Add Network"
4. Click "Add a network manually"
5. Enter these details:
   - **Network Name:** Hardhat Local
   - **New RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** GO (or ETH - you'll see a warning, it's safe to ignore)
6. Click "Save"

**Note:** MetaMask will show a warning about the token symbol not matching the network. This is normal for local development networks. You can safely proceed by clicking "Continue" or "I understand".

#### Step 4: Import Test Account to MetaMask

When you started Hardhat node, it showed you test accounts. Import one:

1. Copy a private key from the Hardhat node output
2. Open MetaMask
3. Click on account icon → Import Account
4. Paste the private key
5. Click "Import"

#### Step 5: Switch to Hardhat Network in MetaMask

1. Click network dropdown in MetaMask
2. Select "Hardhat Local"
3. Refresh your application
4. Click "Connect Wallet"

### Option 2: Deploy to Testnet (Sepolia, Goerli, etc.)

#### Step 1: Get Testnet ETH
- Visit a faucet for your chosen testnet
- Get some test ETH

#### Step 2: Configure Hardhat
Edit `blockchain/hardhat.config.js`:

```javascript
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
}
```

#### Step 3: Deploy
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia
```

#### Step 4: Switch MetaMask to Sepolia Network

### Option 3: Use Existing Deployment

If the contract is already deployed:

1. Find the contract address
2. Update `src/contracts/EvidenceChainOfCustody.json`:
   ```json
   {
     "address": "0xYourContractAddress",
     "abi": [...]
   }
   ```
3. Make sure you're connected to the correct network

## Verifying Deployment

After deployment, check:

1. **Contract address is updated** in `src/contracts/EvidenceChainOfCustody.json`
2. **MetaMask is on the correct network**
3. **No more BAD_DATA errors** in console
4. **Can connect wallet** successfully

## Troubleshooting

### Error: "Contract not deployed at this address"
- Make sure Hardhat node is running
- Redeploy the contract
- Check MetaMask is on Hardhat Local network (Chain ID: 31337)

### Error: "wrong address or chainId"
- MetaMask is on wrong network
- Switch to the network where contract is deployed

### Error: "insufficient funds"
- Account doesn't have ETH
- Use a test account from Hardhat node
- Or get testnet ETH from faucet

## Quick Start (Most Common)

```bash
# Terminal 1: Start local node
cd blockchain
npx hardhat node

# Terminal 2: Deploy contract
cd blockchain
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start frontend
npm run dev

# Then in browser:
# 1. Add Hardhat network to MetaMask (Chain ID: 31337)
# 2. Import a test account
# 3. Connect wallet
```

## Current Configuration

Your contract is configured to deploy at:
- **Default Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Network:** Hardhat Local (Chain ID: 31337)
- **RPC:** http://127.0.0.1:8545

This is the default first deployment address on Hardhat. If you redeploy, the address might change.
