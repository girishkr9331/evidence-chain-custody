# 📂 Complete Project Structure

## Blockchain-Based Digital Evidence Chain-of-Custody Platform

---

## 🌳 Directory Tree

```
evidence-chain-custody/
│
├── 📄 README.md                          # Main project documentation
├── 📄 INSTALLATION.md                    # Detailed installation guide
├── 📄 QUICK_START.md                     # Quick setup guide
├── 📄 PROJECT_OVERVIEW.md                # Technical overview
├── 📄 FEATURES.md                        # Complete features list
├── 📄 PROJECT_STRUCTURE.md               # This file
│
├── 📄 package.json                       # Frontend dependencies
├── 📄 vite.config.ts                     # Vite configuration
├── 📄 tsconfig.json                      # TypeScript config
├── 📄 tsconfig.node.json                 # Node TypeScript config
├── 📄 tailwind.config.js                 # TailwindCSS config
├── 📄 postcss.config.js                  # PostCSS config
├── 📄 index.html                         # HTML entry point
├── 📄 .env                               # Environment variables
├── 📄 .env.example                       # Environment template
├── 📄 .gitignore                         # Git ignore rules
│
├── 📁 blockchain/                        # Blockchain smart contracts
│   ├── 📄 package.json                   # Blockchain dependencies
│   ├── 📄 hardhat.config.js              # Hardhat configuration
│   │
│   ├── 📁 contracts/                     # Solidity smart contracts
│   │   └── 📄 EvidenceChainOfCustody.sol # Main evidence contract
│   │
│   └── 📁 scripts/                       # Deployment scripts
│       └── 📄 deploy.js                  # Contract deployment script
│
├── 📁 backend/                           # Express.js backend
│   ├── 📄 server.js                      # Main server file
│   │
│   ├── 📁 models/                        # MongoDB models
│   │   ├── 📄 User.js                    # User schema
│   │   └── 📄 Evidence.js                # Evidence schema
│   │
│   ├── 📁 routes/                        # API routes
│   │   ├── 📄 auth.js                    # Authentication routes
│   │   └── 📄 evidence.js                # Evidence routes
│   │
│   └── 📁 middleware/                    # Express middleware
│       └── 📄 auth.js                    # Auth middleware
│
└── 📁 src/                               # React frontend
    ├── 📄 main.tsx                       # React entry point
    ├── 📄 App.tsx                        # Main App component
    ├── 📄 index.css                      # Global styles
    │
    ├── 📁 components/                    # Reusable components
    │   ├── 📄 Layout.tsx                 # Main layout wrapper
    │   └── 📄 ProtectedRoute.tsx         # Route protection
    │
    ├── 📁 context/                       # React Context providers
    │   ├── 📄 Web3Context.tsx            # Web3/Blockchain context
    │   └── 📄 AuthContext.tsx            # Authentication context
    │
    ├── 📁 pages/                         # Page components
    │   ├── 📄 Login.tsx                  # Login page
    │   ├── 📄 Register.tsx               # Registration page
    │   ├── 📄 Dashboard.tsx              # Main dashboard
    │   ├── 📄 EvidenceUpload.tsx         # Evidence upload
    │   ├── 📄 EvidenceList.tsx           # Evidence listing
    │   ├── 📄 EvidenceDetails.tsx        # Evidence details
    │   ├── 📄 AuditTrail.tsx             # Audit trail view
    │   ├── 📄 Alerts.tsx                 # Security alerts
    │   └── 📄 UserManagement.tsx         # User management
    │
    └── 📁 contracts/                     # Generated contract files
        └── 📄 EvidenceChainOfCustody.json # Contract ABI & address
```

---

## 📊 File Count Summary

```
Total Files: 40+
Documentation: 6 files
Configuration: 8 files
Smart Contracts: 1 file
Backend Files: 6 files
Frontend Components: 15 files
Scripts: 1 file
```

---

## 📝 File Descriptions

### 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation with overview, features, and basic setup |
| `INSTALLATION.md` | Detailed step-by-step installation instructions |
| `QUICK_START.md` | Quick setup guide for fast deployment |
| `PROJECT_OVERVIEW.md` | Technical architecture and project details |
| `FEATURES.md` | Complete list of implemented features |
| `PROJECT_STRUCTURE.md` | This file - project structure documentation |

### ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies and scripts |
| `vite.config.ts` | Vite build tool configuration |
| `tsconfig.json` | TypeScript compiler configuration |
| `tsconfig.node.json` | TypeScript config for Node.js |
| `tailwind.config.js` | TailwindCSS styling configuration |
| `postcss.config.js` | PostCSS configuration |
| `.env` | Environment variables (not in git) |
| `.env.example` | Environment variables template |
| `.gitignore` | Git ignore patterns |

### ⛓️ Blockchain Files

| File | Purpose |
|------|---------|
| `blockchain/contracts/EvidenceChainOfCustody.sol` | Main smart contract in Solidity |
| `blockchain/scripts/deploy.js` | Contract deployment script |
| `blockchain/hardhat.config.js` | Hardhat framework configuration |
| `blockchain/package.json` | Blockchain dependencies |

### 🖥️ Backend Files

| File | Purpose |
|------|---------|
| `backend/server.js` | Express server entry point |
| `backend/models/User.js` | User database schema |
| `backend/models/Evidence.js` | Evidence database schema |
| `backend/routes/auth.js` | Authentication API routes |
| `backend/routes/evidence.js` | Evidence API routes |
| `backend/middleware/auth.js` | Authentication middleware |

### 🎨 Frontend Files

#### Core Files
| File | Purpose |
|------|---------|
| `src/main.tsx` | React application entry point |
| `src/App.tsx` | Main app component with routing |
| `src/index.css` | Global CSS styles |
| `index.html` | HTML template |

#### Components
| File | Purpose |
|------|---------|
| `src/components/Layout.tsx` | Main layout with sidebar navigation |
| `src/components/ProtectedRoute.tsx` | Authentication guard for routes |

#### Context Providers
| File | Purpose |
|------|---------|
| `src/context/Web3Context.tsx` | Web3/Blockchain state management |
| `src/context/AuthContext.tsx` | Authentication state management |

#### Pages
| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | User login page |
| `src/pages/Register.tsx` | User registration page |
| `src/pages/Dashboard.tsx` | Main dashboard with statistics |
| `src/pages/EvidenceUpload.tsx` | Evidence upload form |
| `src/pages/EvidenceList.tsx` | Evidence listing and search |
| `src/pages/EvidenceDetails.tsx` | Detailed evidence view |
| `src/pages/AuditTrail.tsx` | Complete audit trail view |
| `src/pages/Alerts.tsx` | Security alerts management |
| `src/pages/UserManagement.tsx` | User administration |

---

## 🔗 File Dependencies

### Frontend Dependencies Flow
```
main.tsx
  └── App.tsx
      ├── Web3Context (Blockchain connection)
      ├── AuthContext (Authentication)
      └── Routes
          ├── Login/Register (Public)
          └── ProtectedRoute
              ├── Layout (Navigation)
              └── Pages (Dashboard, Evidence, etc.)
```

### Backend Dependencies Flow
```
server.js
  ├── Routes
  │   ├── auth.js → User.js (model)
  │   └── evidence.js → Evidence.js (model)
  └── Middleware
      └── auth.js (JWT verification)
```

### Blockchain Dependencies Flow
```
deploy.js
  └── EvidenceChainOfCustody.sol
      └── Deployed Contract
          └── src/contracts/EvidenceChainOfCustody.json
```

---

## 📦 Generated Files (Not in Repository)

These files are generated during development and not tracked in git:

```
📁 node_modules/                  # Frontend dependencies
📁 blockchain/node_modules/       # Blockchain dependencies
📁 blockchain/artifacts/          # Compiled contracts
📁 blockchain/cache/              # Hardhat cache
📁 dist/                          # Production build
📁 src/contracts/                 # Generated contract files
```

---

## 🔄 Data Flow Between Files

### Evidence Upload Flow
```
1. EvidenceUpload.tsx
   ↓ (User selects file)
2. Calculate SHA-256 hash (CryptoJS)
   ↓ (Hash ready)
3. Web3Context.tsx → Smart Contract
   ↓ (Blockchain transaction)
4. EvidenceChainOfCustody.sol
   ↓ (Store hash on chain)
5. backend/routes/evidence.js
   ↓ (Store metadata)
6. Evidence.js (MongoDB)
   ↓ (Confirmation)
7. EvidenceList.tsx (Updated view)
```

### Authentication Flow
```
1. Login.tsx (User credentials)
   ↓
2. AuthContext.tsx (Submit)
   ↓
3. backend/routes/auth.js (Validate)
   ↓
4. User.js (Check database)
   ↓
5. auth.js middleware (Generate JWT)
   ↓
6. AuthContext.tsx (Store token)
   ↓
7. Protected pages (Access granted)
```

---

## 🎯 Key Integration Points

### Frontend ↔ Blockchain
```
Web3Context.tsx
  ├── Connects to MetaMask
  ├── Loads contract ABI
  ├── Calls contract functions
  └── Listens to events
```

### Frontend ↔ Backend
```
AuthContext.tsx + Axios
  ├── POST /api/auth/login
  ├── POST /api/auth/register
  ├── GET /api/evidence
  └── POST /api/evidence
```

### Backend ↔ Database
```
Mongoose Models
  ├── User.js → users collection
  └── Evidence.js → evidence collection
```

---

## 📈 Code Statistics

### Lines of Code (Approximate)
```
Smart Contracts:     500+ lines
Backend:             400+ lines
Frontend Components: 2500+ lines
Context/Utils:       400+ lines
Documentation:       1500+ lines
───────────────────────────────
Total:              5300+ lines
```

### File Types Distribution
```
TypeScript/TSX:  15 files (Frontend)
JavaScript:      9 files (Backend/Scripts)
Solidity:        1 file (Smart Contract)
Configuration:   8 files
Documentation:   6 files
───────────────────────────────
Total:          39 files
```

---

## 🔧 Build & Runtime Files

### Development Mode
```
Running Services:
1. Hardhat Node (Port 8545)
2. Backend Server (Port 5000)
3. Vite Dev Server (Port 3000)
4. MongoDB (Port 27017)
```

### Production Build
```
npm run build generates:
└── dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── src/contracts/
        └── EvidenceChainOfCustody.json
```

---

## 📚 Import Structure

### Commonly Imported Modules

#### Frontend
```typescript
// React & Routing
import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

// Context
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'

// UI Components
import Layout from '../components/Layout'

// Libraries
import toast from 'react-hot-toast'
import { ethers } from 'ethers'
import CryptoJS from 'crypto-js'
```

#### Backend
```javascript
// Express
import express from 'express'
import cors from 'cors'

// Database
import mongoose from 'mongoose'

// Security
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
```

---

## 🎨 Styling Structure

### TailwindCSS Classes Used
```
Layout: flex, grid, container
Spacing: p-*, m-*, gap-*
Colors: bg-*, text-*, border-*
Typography: text-*, font-*
Effects: rounded-*, shadow-*
Responsive: sm:, md:, lg:*
```

---

## 🔐 Environment Variables

### Required Variables
```env
# Backend
PORT=5000
MONGODB_URI=mongodb://localhost:27017/evidence-custody
JWT_SECRET=your-secret-key

# Blockchain
BLOCKCHAIN_NETWORK=localhost
CONTRACT_ADDRESS=auto-generated

# Optional
IPFS_API_URL=http://localhost:5001
```

---

## ✅ Checklist for New Developers

- [ ] Clone/download project files
- [ ] Install Node.js and MongoDB
- [ ] Run `npm install` in root and blockchain folders
- [ ] Copy `.env.example` to `.env`
- [ ] Start MongoDB service
- [ ] Start Hardhat node
- [ ] Deploy smart contracts
- [ ] Start backend server
- [ ] Start frontend dev server
- [ ] Configure MetaMask
- [ ] Access http://localhost:3000

---

## 📞 File Relationships Map

```
Configuration Files
    ↓
Install Dependencies
    ↓
    ├─→ Blockchain Setup
    │       ↓
    │   Deploy Contract
    │       ↓
    │   Generate ABI
    │
    ├─→ Backend Setup
    │       ↓
    │   Connect Database
    │       ↓
    │   Start API Server
    │
    └─→ Frontend Setup
            ↓
        Load Contract
            ↓
        Connect Wallet
            ↓
        Render UI
```

---

**Project Structure Complete! All 40+ files organized and documented. 🎉**
