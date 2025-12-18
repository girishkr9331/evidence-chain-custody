# 📦 Step-by-Step Installation Guide

## Complete Installation Procedure for Evidence Chain of Custody Platform

Follow these instructions **line by line** for successful setup.

---

## ✅ Prerequisites Checklist

Before starting, install these required software:

### 1. Node.js and npm
```bash
# Download from: https://nodejs.org/
# Choose LTS version (v18 or higher)

# Verify installation
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

### 2. MongoDB
```bash
# Download from: https://www.mongodb.com/try/download/community
# Install MongoDB Community Edition

# For Windows:
# - Download MSI installer
# - Run installer with default settings
# - MongoDB will be installed as a Windows service

# For macOS:
brew tap mongodb/brew
brew install mongodb-community

# For Linux (Ubuntu/Debian):
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Verify installation
mongod --version  # Should show MongoDB version
```

### 3. MetaMask Browser Extension
```
# Install from: https://metamask.io/download/
# Available for Chrome, Firefox, Brave, Edge
# Click "Install MetaMask" and follow the setup wizard
```

### 4. Git (Optional)
```bash
# Download from: https://git-scm.com/downloads
# Verify installation
git --version
```

---

## 🚀 Installation Steps

### STEP 1: Navigate to Project Directory

```bash
# Open Terminal/Command Prompt
# Navigate to where you extracted the project files
cd path/to/evidence-chain-custody

# Example:
# Windows: cd C:\Users\YourName\Documents\evidence-chain-custody
# macOS/Linux: cd ~/Documents/evidence-chain-custody
```

### STEP 2: Install Frontend Dependencies

```bash
# Make sure you're in the root project directory
npm install

# This will install:
# - React, React Router, TypeScript
# - TailwindCSS, Vite
# - Ethers.js, Axios
# - Other frontend dependencies

# Wait for installation to complete (2-5 minutes)
```

### STEP 3: Install Blockchain Dependencies

```bash
# Navigate to blockchain folder
cd blockchain

# Install Hardhat and related packages
npm install

# Return to root directory
cd ..

# This installs:
# - Hardhat framework
# - Ethereum libraries
# - Smart contract development tools
```

### STEP 4: Set Up Environment Variables

```bash
# Copy the example environment file
# Windows Command Prompt:
copy .env.example .env

# Windows PowerShell / macOS / Linux:
cp .env.example .env

# Open .env file in a text editor and update if needed
# Default values should work for local development
```

### STEP 5: Start MongoDB Database

```bash
# === For Windows ===
# Method 1: Using Services
# 1. Press Win + R
# 2. Type: services.msc
# 3. Find "MongoDB Server"
# 4. Right-click → Start

# Method 2: Command Line
net start MongoDB

# === For macOS ===
brew services start mongodb-community

# === For Linux ===
sudo systemctl start mongod

# Verify MongoDB is running:
mongosh --eval "db.adminCommand('ping')"
# Should output: { ok: 1 }
```

### STEP 6: Start Blockchain Network

```bash
# Open a NEW Terminal window (Terminal 1)
# Navigate to project directory
cd path/to/evidence-chain-custody/blockchain

# Start local Hardhat blockchain node
npx hardhat node

# ⚠️ IMPORTANT: Keep this terminal running!
# You should see:
# - Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
# - Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# - Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# - (and 19 more accounts...)

# 📝 Copy one of the private keys for later use
```

### STEP 7: Deploy Smart Contracts

```bash
# Open a NEW Terminal window (Terminal 2)
# Navigate to project root
cd path/to/evidence-chain-custody

# Deploy the smart contract to local blockchain
npm run deploy

# You should see:
# Deploying EvidenceChainOfCustody contract...
# EvidenceChainOfCustody deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# Contract ABI and address saved to src/contracts/

# ✅ Contract is now deployed and ready to use!
```

### STEP 8: Configure MetaMask Wallet

#### 8.1 Add Local Network to MetaMask

```
1. Open MetaMask extension in your browser
2. Click the network dropdown (top center)
3. Click "Add Network" or "Add network manually"
4. Enter these details:

   Network Name: Localhost 8545
   New RPC URL: http://127.0.0.1:8545
   Chain ID: 1337
   Currency Symbol: ETH

5. Click "Save"
6. Switch to "Localhost 8545" network
```

#### 8.2 Import Test Account

```
1. In MetaMask, click account icon (top right)
2. Click "Import Account"
3. Paste the private key you copied from Terminal 1
   Example: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
4. Click "Import"
5. You should now see 10000 ETH in your account
```

### STEP 9: Start Backend Server

```bash
# Open a NEW Terminal window (Terminal 3)
# Navigate to project root
cd path/to/evidence-chain-custody

# Start the Express backend server
npm run server

# You should see:
# ✅ MongoDB connected successfully
# 🚀 Server running on port 5000

# ⚠️ IMPORTANT: Keep this terminal running!
```

### STEP 10: Start Frontend Application

```bash
# Open a NEW Terminal window (Terminal 4)
# Navigate to project root
cd path/to/evidence-chain-custody

# Start the React development server
npm run dev

# You should see:
#   VITE v5.0.8  ready in 500 ms
#   ➜  Local:   http://localhost:3000/
#   ➜  Network: use --host to expose

# ⚠️ IMPORTANT: Keep this terminal running!
```

### STEP 11: Access the Application

```
1. Open your web browser (Chrome, Firefox, Edge, Brave)
2. Navigate to: http://localhost:3000
3. You should see the login page of the Evidence Chain platform
```

---

## 🎯 Quick Start Guide

### First-Time User Registration

```
1. Click "Register here" link on login page
2. Click "Connect" button to connect MetaMask
3. Approve the connection request in MetaMask popup
4. Fill in the registration form:
   - Wallet Address: (automatically filled)
   - Full Name: Enter your name
   - Department: e.g., "Cyber Crime Unit"
   - Role: Select from dropdown (Police, Investigator, etc.)
   - Password: Create a password (min 6 characters)
   - Confirm Password: Re-enter password
5. Click "Create Account"
6. Wait for confirmation message
7. You'll be redirected to login page
```

### Login to the System

```
1. On login page, click "Connect" if wallet not connected
2. Enter your password
3. Click "Sign In"
4. You'll be redirected to the Dashboard
```

### Upload Your First Evidence

```
1. Click "Upload Evidence" in the sidebar
2. Fill in the form:
   - Evidence ID: e.g., "EV-2024-001"
   - Case ID: e.g., "CASE-2024-001"
   - Category: Select from dropdown
   - Description: Describe the evidence
3. Click "Click to upload file" and select a file
4. Wait for SHA-256 hash calculation
5. Click "Register Evidence on Blockchain"
6. Confirm the transaction in MetaMask
7. Wait for blockchain confirmation
8. Evidence is now registered!
```

---

## 🔍 Verify Installation

### Check All Services Running

```bash
# Terminal 1: Hardhat Node
# Should show: Started HTTP and WebSocket JSON-RPC server

# Terminal 2: (closed after deployment)
# Smart contract deployment completed

# Terminal 3: Backend Server
# Should show: Server running on port 5000

# Terminal 4: Frontend Server  
# Should show: Local: http://localhost:3000/
```

### Test MongoDB Connection

```bash
# Open a new terminal
mongosh

# You should enter MongoDB shell
# Type: exit to quit
```

### Test Backend API

```bash
# Open browser and visit:
http://localhost:5000/api/health

# Should return:
# {"status":"ok","message":"Evidence Chain API is running"}
```

---

## 🛠️ Troubleshooting

### Problem: "npm: command not found"
**Solution:**
```bash
# Node.js not installed properly
# Reinstall Node.js from: https://nodejs.org/
# Restart terminal after installation
```

### Problem: "MongoDB connection failed"
**Solution:**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# If not running, start it:
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Problem: "Port 3000 already in use"
**Solution:**
```bash
# Windows:
netstat -ano | findstr :3000
# Note the PID and kill it:
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill
```

### Problem: "MetaMask connection rejected"
**Solution:**
```
1. Make sure MetaMask is unlocked
2. Switch to "Localhost 8545" network in MetaMask
3. Refresh the webpage
4. Try connecting again
```

### Problem: "Contract not found"
**Solution:**
```bash
# Redeploy the smart contract
npm run deploy

# Make sure Hardhat node is running in Terminal 1
```

### Problem: "Transaction failed"
**Solution:**
```
1. Check if you have enough ETH in MetaMask
2. Make sure you're on Localhost 8545 network
3. Try resetting MetaMask account:
   - Settings → Advanced → Reset Account
4. Refresh the page and try again
```

---

## 📝 Daily Usage (After Initial Setup)

Every time you want to use the application:

```bash
# 1. Start MongoDB (if not auto-started)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community

# 2. Start Blockchain Node (Terminal 1)
cd blockchain
npx hardhat node

# 3. Start Backend Server (Terminal 2)
npm run server

# 4. Start Frontend (Terminal 3)
npm run dev

# 5. Open browser: http://localhost:3000
```

---

## 🎓 For Project Demonstration

When presenting your project:

1. **Show all terminals running** (Blockchain, Backend, Frontend)
2. **Demonstrate user registration** with MetaMask
3. **Upload sample evidence** with file hash
4. **Show audit trail** with blockchain records
5. **Display security alerts** system
6. **Export audit logs** as CSV
7. **Explain the smart contract** code

---

## 📞 Need Help?

Common resources:
- Node.js Docs: https://nodejs.org/docs/
- MongoDB Docs: https://docs.mongodb.com/
- Hardhat Docs: https://hardhat.org/docs
- React Docs: https://react.dev/
- MetaMask Docs: https://docs.metamask.io/

---

**Installation Complete! You're ready to use the Evidence Chain of Custody Platform! 🎉**
