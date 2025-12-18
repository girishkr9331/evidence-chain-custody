# ✅ Complete Installation & Testing Checklist

Use this checklist to ensure everything is set up correctly!

---

## 📋 Pre-Installation Checklist

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB installed and accessible
- [ ] MetaMask browser extension installed
- [ ] Git installed (optional)
- [ ] Text editor ready (VS Code recommended)

---

## 🚀 Installation Steps Checklist

### Step 1: Project Setup
- [ ] Navigated to project directory
- [ ] Ran `npm install` successfully
- [ ] Ran `cd blockchain && npm install` successfully
- [ ] Returned to root directory
- [ ] Copied `.env.example` to `.env`

### Step 2: MongoDB Setup
- [ ] MongoDB service started
- [ ] Verified with `mongosh --eval "db.adminCommand('ping')"`
- [ ] Connection successful (received `{ ok: 1 }`)

### Step 3: Blockchain Setup
- [ ] Opened Terminal 1
- [ ] Navigated to `blockchain` directory
- [ ] Ran `npx hardhat node`
- [ ] Hardhat node running (showing accounts)
- [ ] Copied a private key for MetaMask
- [ ] **Terminal 1 kept running** ✓

### Step 4: Smart Contract Deployment
- [ ] Opened Terminal 2
- [ ] Ran `npm run deploy` from root
- [ ] Deployment successful
- [ ] Contract address displayed
- [ ] ABI saved to `src/contracts/EvidenceChainOfCustody.json`
- [ ] File exists and contains address

### Step 5: MetaMask Configuration
- [ ] Opened MetaMask extension
- [ ] Added "Localhost 8545" network
- [ ] Network settings correct:
  - [ ] RPC URL: `http://127.0.0.1:8545`
  - [ ] Chain ID: `1337`
  - [ ] Currency: `ETH`
- [ ] Switched to Localhost 8545 network
- [ ] Imported account with private key
- [ ] Account shows 10000 ETH balance

### Step 6: Backend Server
- [ ] Using Terminal 2 (or opened Terminal 3)
- [ ] Ran `npm run server` from root
- [ ] Backend started successfully
- [ ] See: "✅ MongoDB connected successfully"
- [ ] See: "🚀 Server running on port 5000"
- [ ] **Terminal kept running** ✓
- [ ] Tested: `http://localhost:5000/api/health` returns OK

### Step 7: Frontend Application
- [ ] Opened Terminal 3 (or Terminal 4)
- [ ] Ran `npm run dev` from root
- [ ] Vite started successfully
- [ ] See: "Local: http://localhost:3000/"
- [ ] **Terminal kept running** ✓

### Step 8: Access Application
- [ ] Opened browser
- [ ] Navigated to `http://localhost:3000`
- [ ] Login page loaded successfully
- [ ] No console errors (F12 to check)

---

## 🧪 Functionality Testing Checklist

### Test 1: User Registration
- [ ] Clicked "Register here" link
- [ ] Clicked "Connect" wallet button
- [ ] MetaMask popup appeared
- [ ] Approved connection in MetaMask
- [ ] Wallet address auto-filled
- [ ] Filled in all registration fields:
  - [ ] Full Name
  - [ ] Department
  - [ ] Role selected
  - [ ] Password (min 6 chars)
  - [ ] Confirmed password
- [ ] Clicked "Create Account"
- [ ] Success message appeared
- [ ] Redirected to login page

### Test 2: User Login
- [ ] On login page
- [ ] Wallet already connected (or reconnected)
- [ ] Entered password
- [ ] Clicked "Sign In"
- [ ] Success message appeared
- [ ] Redirected to Dashboard
- [ ] Dashboard loaded with stats

### Test 3: Dashboard Navigation
- [ ] Dashboard displays correctly
- [ ] Statistics cards showing data
- [ ] Charts rendering properly
- [ ] Sidebar navigation visible
- [ ] All menu items clickable
- [ ] User info shown in sidebar

### Test 4: Evidence Upload
- [ ] Clicked "Upload Evidence" in sidebar
- [ ] Upload form displayed
- [ ] Filled in evidence details:
  - [ ] Evidence ID (e.g., EV-2024-001)
  - [ ] Case ID (e.g., CASE-2024-001)
  - [ ] Category selected
  - [ ] Description entered
- [ ] Clicked "Click to upload file"
- [ ] Selected a test file
- [ ] File hash calculated automatically
- [ ] SHA-256 hash displayed
- [ ] Clicked "Register Evidence on Blockchain"
- [ ] MetaMask popup appeared
- [ ] Confirmed transaction in MetaMask
- [ ] Transaction processing message shown
- [ ] Success message appeared
- [ ] Evidence registered successfully

### Test 5: Evidence List
- [ ] Clicked "Evidence List" in sidebar
- [ ] Evidence list page loaded
- [ ] Uploaded evidence appears in list
- [ ] Evidence card shows:
  - [ ] Evidence ID
  - [ ] Case ID
  - [ ] Category badge
  - [ ] Description
  - [ ] Custodian address
  - [ ] Date
- [ ] Search box works
- [ ] Category filter works
- [ ] Clicked "View Details" on evidence

### Test 6: Evidence Details
- [ ] Evidence details page loaded
- [ ] All information displayed:
  - [ ] Evidence ID and Case ID
  - [ ] Category and description
  - [ ] Collector address
  - [ ] Current custodian
  - [ ] SHA-256 hash
  - [ ] Collection date
- [ ] "Record Access" button works
- [ ] MetaMask confirms transaction
- [ ] Access recorded successfully
- [ ] Recent activity updated

### Test 7: Audit Trail
- [ ] Clicked "Audit Trail" in sidebar
- [ ] Audit trail page loaded
- [ ] All actions displayed in table
- [ ] Actions show:
  - [ ] Timestamp
  - [ ] Evidence ID
  - [ ] Action type (colored badge)
  - [ ] Actor address
  - [ ] Notes
- [ ] Search functionality works
- [ ] Action filter works
- [ ] "Export CSV" button works
- [ ] CSV file downloaded successfully

### Test 8: Alerts System
- [ ] Clicked "Alerts" in sidebar
- [ ] Alerts page loaded
- [ ] Statistics cards displayed
- [ ] Filter buttons work (ALL/UNRESOLVED/RESOLVED)
- [ ] Alerts listed (may be empty initially)

### Test 9: User Management
- [ ] Clicked "User Management" in sidebar
- [ ] User management page loaded
- [ ] Current users listed in table
- [ ] User information displayed:
  - [ ] Name
  - [ ] Wallet address
  - [ ] Role (colored badge)
  - [ ] Department
  - [ ] Status (Active/Inactive)
- [ ] "Add User" button visible

### Test 10: Wallet Functionality
- [ ] Wallet address shown in sidebar
- [ ] Wallet connection indicator green
- [ ] Can disconnect and reconnect wallet
- [ ] MetaMask transactions work
- [ ] ETH balance updates after transactions

---

## 🔍 Blockchain Verification Checklist

### Verify Smart Contract
- [ ] Check Terminal 1 (Hardhat node)
- [ ] See transaction logs for:
  - [ ] Contract deployment
  - [ ] Evidence registration
  - [ ] Evidence access
- [ ] Each transaction shows gas used
- [ ] Block numbers incrementing

### Verify Data Persistence
- [ ] Refresh browser page
- [ ] Still logged in (or can login again)
- [ ] Evidence still appears in list
- [ ] Audit trail data persists
- [ ] Blockchain data immutable

---

## 🛠️ Troubleshooting Checklist

### If Login Fails
- [ ] Check MongoDB is running
- [ ] Check backend terminal for errors
- [ ] Verify credentials are correct
- [ ] Try registering again

### If Wallet Won't Connect
- [ ] MetaMask is unlocked
- [ ] On Localhost 8545 network
- [ ] Account has ETH balance
- [ ] Try disconnecting and reconnecting

### If Contract Errors Occur
- [ ] Hardhat node is still running (Terminal 1)
- [ ] Contract was deployed successfully
- [ ] Contract file exists: `src/contracts/EvidenceChainOfCustody.json`
- [ ] Try redeploying: `npm run deploy`

### If Backend Errors Occur
- [ ] MongoDB service is running
- [ ] Backend terminal shows no errors
- [ ] Check `.env` file exists
- [ ] Port 5000 is not in use

### If Frontend Won't Load
- [ ] Frontend terminal shows no errors
- [ ] Port 3000 is not in use
- [ ] Try clearing browser cache
- [ ] Check browser console (F12)

---

## ✅ Final Verification

### All Systems Go
- [ ] 3-4 terminals running simultaneously:
  - [ ] Terminal 1: Hardhat node ✓
  - [ ] Terminal 2: Backend server ✓
  - [ ] Terminal 3: Frontend dev server ✓
- [ ] Can access http://localhost:3000
- [ ] Can register and login
- [ ] Can upload evidence
- [ ] Can view audit trail
- [ ] Blockchain transactions confirmed
- [ ] No critical errors in any terminal

### Ready for Demonstration
- [ ] Application fully functional
- [ ] Sample evidence uploaded
- [ ] Understand the flow
- [ ] Can explain features
- [ ] Know how to restart if needed

---

## 🎓 Pre-Presentation Checklist

### Technical Preparation
- [ ] Test complete demo flow
- [ ] Prepare sample files for upload
- [ ] Practice explaining smart contract
- [ ] Understand blockchain benefits
- [ ] Know all features

### Presentation Materials
- [ ] Slides prepared (if required)
- [ ] Screenshots/screen recording ready
- [ ] Code snippets highlighted
- [ ] Architecture diagram ready
- [ ] Demo script written

### Backup Plan
- [ ] Screenshots of working application
- [ ] Video recording of demo
- [ ] Can explain without live demo
- [ ] Know troubleshooting steps

---

## 📊 Success Metrics

**Installation Successful If:**
- ✅ All 3-4 terminals running without errors
- ✅ Can access application at localhost:3000
- ✅ MetaMask connected to local network
- ✅ MongoDB connected successfully

**Application Working If:**
- ✅ Can register new users
- ✅ Can login successfully
- ✅ Can upload evidence with blockchain confirmation
- ✅ Evidence appears in list
- ✅ Audit trail shows all actions
- ✅ All pages load without errors

**Presentation Ready If:**
- ✅ Understand all features
- ✅ Can perform complete demo
- ✅ Can explain blockchain integration
- ✅ Can answer technical questions
- ✅ Have backup materials ready

---

## 🎯 Quick Status Check

Run this quick check before your presentation:

```bash
# Check Node.js
node --version        # Should be v18+

# Check MongoDB
mongosh --eval "db.adminCommand('ping')"  # Should return { ok: 1 }

# Check if ports are available
netstat -an | findstr :3000  # Frontend
netstat -an | findstr :5000  # Backend
netstat -an | findstr :8545  # Blockchain

# Check if files exist
ls src/contracts/EvidenceChainOfCustody.json  # Contract ABI
ls .env                                        # Environment vars
```

---

## 💯 Project Complete When

- [x] ✅ All code files created (43 files)
- [x] ✅ Smart contract implemented
- [x] ✅ Frontend fully functional
- [x] ✅ Backend API working
- [x] ✅ Database integrated
- [x] ✅ Documentation complete (7 guides)
- [x] ✅ Installation tested
- [x] ✅ Demo prepared
- [x] ✅ Ready to present!

---

**Use this checklist each time you set up or test the application!**

**Good luck! 🚀🎓**
