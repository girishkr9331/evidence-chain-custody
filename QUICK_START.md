# ⚡ Quick Start Guide

## Get Up and Running in 10 Minutes

---

## 📋 Before You Start

Make sure you have installed:
- ✅ Node.js (v18+)
- ✅ MongoDB
- ✅ MetaMask browser extension

---

## 🚀 Quick Setup Commands

### 1. Install Dependencies (2 minutes)

```bash
# Install all dependencies
npm install
cd blockchain && npm install && cd ..
```

### 2. Start Services (3 terminals needed)

**Terminal 1 - Blockchain:**
```bash
cd blockchain
npx hardhat node
# Keep running ✓
```

**Terminal 2 - Deploy & Backend:**
```bash
# Deploy contract
npm run deploy

# Start backend
npm run server
# Keep running ✓
```

**Terminal 3 - Frontend:**
```bash
npm run dev
# Keep running ✓
```

### 3. Configure MetaMask (2 minutes)

```
Network Settings:
- Name: Localhost 8545
- RPC: http://127.0.0.1:8545
- Chain ID: 1337
- Symbol: ETH

Import Account:
- Use any private key from Terminal 1
```

### 4. Access Application

Open browser: **http://localhost:3000**

---

## 🎯 First Steps

1. **Register**: Click "Register here" → Connect wallet → Fill form
2. **Login**: Enter password → Sign in
3. **Upload Evidence**: Upload Evidence → Fill details → Select file → Register
4. **View**: Check Evidence List, Audit Trail, Dashboard

---

## 🔧 Common Commands

```bash
# Start everything (after initial setup)
npm run blockchain    # Terminal 1
npm run server       # Terminal 2  
npm run dev          # Terminal 3

# Deploy contract (if restarted blockchain)
npm run deploy

# Build for production
npm run build
```

---

## ❓ Quick Troubleshooting

**Contract Error?** → Redeploy: `npm run deploy`  
**MongoDB Error?** → Start MongoDB: `net start MongoDB` (Windows)  
**Port Busy?** → Kill process or change port  
**MetaMask?** → Switch to Localhost 8545 network

---

## 📁 Important Files

```
evidence-chain-custody/
├── README.md              ← Full documentation
├── INSTALLATION.md        ← Detailed installation
├── blockchain/contracts/  ← Smart contracts
├── src/pages/            ← React pages
├── backend/              ← Express API
└── .env                  ← Configuration
```

---

## 🎓 For Quick Demo

```bash
# Terminal 1
cd blockchain && npx hardhat node

# Terminal 2
npm run deploy && npm run server

# Terminal 3
npm run dev

# Browser: http://localhost:3000
# Register → Login → Upload Evidence → Show Audit Trail
```

---

**Need detailed instructions? Check `INSTALLATION.md` or `README.md`**

**Ready to start? Let's go! 🚀**
