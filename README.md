# Blockchain-Based Digital Evidence Chain-of-Custody Platform

A comprehensive Web3/Blockchain-based evidence management platform for police and cybercrime units to maintain tamper-proof, transparent, and traceable digital evidence records.

## 🎯 Features

- **Immutable Blockchain Ledger**: Every evidence action is permanently recorded on Ethereum blockchain
- **Role-Based Access Control**: Secure permissioned access for Police, Investigators, Forensic Labs, Courts, and Cyber Units
- **Timestamped Audit Trail**: Complete history of every interaction with evidence
- **Cryptographic Verification**: SHA-256 hashing for evidence integrity verification
- **Digital Vault**: Secure storage for evidence metadata and fingerprints
- **Interactive Dashboard**: Real-time tracking of evidence flow and ownership
- **Automated Alerts**: Notifications for unauthorized access or tampering attempts
- **Integration APIs**: REST APIs for integration with existing police systems

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for modern UI/UX
- **Ethers.js** for blockchain interaction
- **React Router** for navigation
- **Recharts** for data visualization
- **React Hot Toast** for notifications

### Blockchain
- **Solidity 0.8.20** for smart contracts
- **Hardhat** for development and testing
- **Ethereum** blockchain
- **MetaMask** for wallet integration

### Backend
- **Node.js** with Express
- **MongoDB** for off-chain data storage
- **JWT** for authentication
- **Bcrypt** for password hashing

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **MetaMask** browser extension - [Install](https://metamask.io/download/)
- **Git** - [Download](https://git-scm.com/downloads)

## 🚀 Installation Guide

Follow these steps carefully to set up the project:

### Step 1: Clone or Extract the Project

```bash
# If you have the files, navigate to the project directory
cd evidence-chain-custody

# Or if cloning from a repository
git clone <repository-url>
cd evidence-chain-custody
```

### Step 2: Install Dependencies

```bash
# Install root dependencies (Frontend)
npm install

# Install blockchain dependencies
cd blockchain
npm install
cd ..

# Note: Backend uses ES modules, no separate install needed
```

### Step 3: Set Up MongoDB

1. **Start MongoDB Service:**

**On Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or use MongoDB Compass GUI
```

**On macOS/Linux:**
```bash
# Start MongoDB
sudo systemctl start mongod

# Or using Homebrew (macOS)
brew services start mongodb-community
```

2. **Verify MongoDB is running:**
```bash
# Check if MongoDB is listening on port 27017
mongosh --eval "db.adminCommand('ping')"
```

### Step 4: Configure Environment Variables

1. **Copy the example environment file:**
```bash
cp .env.example .env
```

2. **Edit `.env` file with your settings:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/evidence-custody
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Step 5: Start Blockchain Local Network

Open a **new terminal window** and run:

```bash
# Navigate to blockchain directory
cd blockchain

# Start local Hardhat node (keep this running)
npx hardhat node
```

**Important:** Keep this terminal running. You should see output showing:
- Started HTTP and WebSocket JSON-RPC server
- List of test accounts with private keys

### Step 6: Deploy Smart Contracts

Open **another new terminal window** and run:

```bash
# From project root, deploy contracts
npm run deploy
```

**Expected output:**
```
Deploying EvidenceChainOfCustody contract...
EvidenceChainOfCustody deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Contract ABI and address saved to src/contracts/
```

The contract address will be automatically saved to `src/contracts/EvidenceChainOfCustody.json`

### Step 7: Configure MetaMask

1. **Open MetaMask extension** in your browser
2. **Add Local Network:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

3. **Import Test Account:**
   - Copy any private key from the Hardhat node output
   - In MetaMask: Account Menu → Import Account
   - Paste the private key
   - You should see 10000 ETH balance

### Step 8: Start Backend Server

Open **another new terminal window** and run:

```bash
# Start the backend server (keep this running)
npm run server
```

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### Step 9: Start Frontend Development Server

Open **another new terminal window** and run:

```bash
# Start the React frontend
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 10: Access the Application

1. **Open your browser** and navigate to: `http://localhost:3000`
2. **You should see the login page**

## 📝 First-Time Setup & Usage

### 1. Register a New User

1. Click **"Register here"** on the login page
2. Click **"Connect"** to connect your MetaMask wallet
3. Approve the connection in MetaMask popup
4. Fill in the registration form:
   - **Wallet Address**: (auto-filled from MetaMask)
   - **Full Name**: Your name
   - **Department**: e.g., "Cyber Crime Investigation"
   - **Role**: Select from dropdown (Police, Investigator, etc.)
   - **Password**: Choose a strong password
5. Click **"Create Account"**

### 2. Login to the System

1. Click **"Connect"** to connect wallet (if not already connected)
2. Enter your **password**
3. Click **"Sign In"**

### 3. Upload Evidence

1. Navigate to **"Upload Evidence"** from the sidebar
2. Fill in the evidence details:
   - **Evidence ID**: Unique identifier (e.g., EV-2024-001)
   - **Case ID**: Related case number (e.g., CASE-2024-001)
   - **Category**: Select evidence type
   - **Description**: Detailed description
3. Click **"Click to upload file"** and select a file
4. Wait for the file hash to be calculated (SHA-256)
5. Click **"Register Evidence on Blockchain"**
6. **Confirm the transaction** in MetaMask popup
7. Wait for blockchain confirmation

### 4. View Evidence List

1. Navigate to **"Evidence List"** from the sidebar
2. Browse all registered evidence
3. Use search and filters to find specific evidence
4. Click **"View Details"** on any evidence card

### 5. View Audit Trail

1. Navigate to **"Audit Trail"** from the sidebar
2. See complete history of all evidence actions
3. Filter by action type or search
4. Export audit trail as CSV

### 6. Manage Alerts

1. Navigate to **"Alerts"** from the sidebar
2. View security alerts (unauthorized access, etc.)
3. Resolve alerts as needed

### 7. User Management (Admin Only)

1. Navigate to **"User Management"** from the sidebar
2. Click **"Add User"** to register new users on blockchain
3. Activate/Deactivate users as needed

## 🔧 Available Scripts

```bash
# Frontend Development
npm run dev              # Start Vite dev server

# Backend
npm run server          # Start Express backend server

# Blockchain
npm run blockchain      # Start Hardhat local node
npm run deploy          # Deploy smart contracts

# Build for Production
npm run build           # Build frontend for production
npm run preview         # Preview production build
```

## 📁 Project Structure

```
evidence-chain-custody/
├── blockchain/                 # Blockchain smart contracts
│   ├── contracts/
│   │   └── EvidenceChainOfCustody.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
├── backend/                   # Express backend
│   ├── models/
│   │   ├── User.js
│   │   └── Evidence.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── evidence.js
│   ├── middleware/
│   │   └── auth.js
│   └── server.js
├── src/                       # React frontend
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/
│   │   ├── Web3Context.tsx
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EvidenceUpload.tsx
│   │   ├── EvidenceList.tsx
│   │   ├── EvidenceDetails.tsx
│   │   ├── AuditTrail.tsx
│   │   ├── Alerts.tsx
│   │   └── UserManagement.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔐 Security Features

1. **Blockchain Immutability**: All evidence actions are permanently recorded
2. **Cryptographic Hashing**: SHA-256 for file integrity verification
3. **Role-Based Access**: Granular permissions based on user roles
4. **JWT Authentication**: Secure token-based authentication
5. **Password Encryption**: Bcrypt hashing for passwords
6. **Audit Trail**: Complete transparency of all actions
7. **Alert System**: Real-time notifications for suspicious activities

## 🎨 User Roles

- **Police**: Upload and manage evidence
- **Investigator**: Access and analyze evidence
- **Forensic Lab**: Perform forensic analysis
- **Court**: View evidence for legal proceedings
- **Cyber Unit**: Monitor and investigate cyber crimes

## 🔍 Key Smart Contract Functions

- `registerEvidence()`: Register new evidence on blockchain
- `accessEvidence()`: Record evidence access
- `transferEvidence()`: Transfer custody between users
- `verifyEvidenceIntegrity()`: Verify evidence hash
- `getAuditTrail()`: Retrieve complete audit history

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Evidence
- `GET /api/evidence` - Get all evidence
- `GET /api/evidence/:id` - Get specific evidence
- `POST /api/evidence` - Create evidence record
- `GET /api/evidence/search` - Search evidence

## 🐛 Troubleshooting

### MetaMask Connection Issues
```bash
# Make sure you're on the correct network (Localhost 8545)
# Chain ID should be 1337
# Try disconnecting and reconnecting the wallet
```

### Smart Contract Errors
```bash
# Redeploy the contract if you restarted the blockchain
npm run deploy
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Restart MongoDB service
# Windows: net start MongoDB
# Linux/Mac: sudo systemctl start mongod
```

### Port Already in Use
```bash
# Find and kill the process using the port
# Windows: netstat -ano | findstr :3000
# Linux/Mac: lsof -ti:3000 | xargs kill
```

## 🎓 For College Project Submission

This project demonstrates:
- ✅ Blockchain integration with smart contracts
- ✅ Modern React frontend with TypeScript
- ✅ RESTful API backend with Express
- ✅ Database integration with MongoDB
- ✅ Authentication and authorization
- ✅ Responsive UI/UX design
- ✅ Security best practices
- ✅ Complete documentation

## 📄 License

This project is created for educational purposes as a college project.

## 👨‍💻 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the console logs for errors
3. Ensure all services are running correctly
4. Verify MetaMask is connected to the correct network

## 🌟 Features Showcase

- **Modern UI**: Clean, minimal design with TailwindCSS
- **Real-time Updates**: Live blockchain data synchronization
- **Data Visualization**: Charts and graphs for insights
- **Export Functionality**: Download audit trails as CSV
- **Search & Filter**: Advanced filtering capabilities
- **Responsive Design**: Works on desktop and mobile devices

---

**Happy Coding! 🚀**
