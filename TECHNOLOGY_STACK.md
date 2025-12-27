# 🛠️ Technology Stack - Evidence Chain Management System

## 🎯 Core Technology Stack (Presentation View)

---

## 🎨 **FRONTEND**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI Framework |
| **TypeScript** | 5.x | Type-Safe Development |
| **Tailwind CSS** | 3.x | Styling Framework |
| **Ethers.js** | 6.x | Web3/Blockchain Integration |
| **Vite** | 5.x | Build Tool & Dev Server |

**Additional:** React Router, Axios, Lucide Icons, React Hot Toast

---

## ⚙️ **BACKEND**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18.x+ | Runtime Environment |
| **Express.js** | 4.x | Web Framework |
| **MongoDB** | 6.x | Database |
| **JWT** | 9.x | Authentication |
| **Mongoose** | 8.x | ODM/Data Modeling |

**Additional:** bcryptjs (Security), CORS, dotenv

---

## ⛓️ **BLOCKCHAIN**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Solidity** | 0.8.19 | Smart Contract Language |
| **Hardhat** | 2.x | Development Environment |
| **Ethereum** | Mainnet/Sepolia | Blockchain Network |
| **Alchemy** | - | Node Provider/Infrastructure |
| **OpenZeppelin** | Latest | Security Libraries |

**Additional:** Hardhat Toolbox, Chai/Mocha Testing, Etherscan

---

## 🚀 **DEPLOYMENT**

| Component | Platform | Purpose |
|-----------|----------|---------|
| **Frontend** | Vercel | React App Hosting |
| **Backend** | Railway | API Server Hosting |
| **Database** | MongoDB Atlas | Managed Database |
| **Blockchain** | Alchemy/Infura | Ethereum Node Access |

---

## 🔐 **SECURITY**

- **SHA-256** - File Hashing & Integrity
- **JWT** - Token-Based Authentication
- **bcryptjs** - Password Hashing
- **HTTPS/TLS** - Encrypted Communication
- **CORS** - Cross-Origin Protection

---

## 📊 **ARCHITECTURE OVERVIEW**

```
┌──────────────┐
│   Frontend   │  React + TypeScript + Tailwind
│   (Vercel)   │  
└──────┬───────┘
       │ REST API
       ▼
┌──────────────┐
│   Backend    │  Node.js + Express + MongoDB
│   (Railway)  │  
└──────┬───────┘
       │
       ├──────► MongoDB Atlas (Data)
       │
       └──────► Alchemy → Ethereum (Blockchain)
```

---

## 📋 **DEPENDENCIES SUMMARY**

### Frontend
```json
{
  "react": "^18.2.0",
  "typescript": "^5.3.3",
  "ethers": "^6.9.0",
  "tailwindcss": "^3.x",
  "vite": "^5.x"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3"
}
```

### Blockchain
```json
{
  "hardhat": "^2.19.4",
  "ethers": "^6.9.0",
  "@nomicfoundation/hardhat-toolbox": "^4.0.0"
}
```

---

**Status: Production Ready ✅**  
**Last Updated: 2025**
