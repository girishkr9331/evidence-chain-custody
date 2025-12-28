# Troubleshooting Guide

## "Pre-transform Error" / "Failed to Resolve Import"

This is the most common error when setting up the project on a new computer.

### ✅ Quick Fix (Run These Commands)

```bash
# 1. Install all dependencies
npm install

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Install blockchain dependencies
cd blockchain
npm install
npx hardhat compile
cd ..

# 4. Clear Vite cache (important!)
Remove-Item -Recurse -Force node_modules/.vite
# Or on Mac/Linux: rm -rf node_modules/.vite

# 5. Start fresh
npm run dev
```

### 🔍 Root Causes

1. **Missing node_modules** - Most common cause
2. **Stale Vite cache** - Old cache causes import resolution failures
3. **Missing contract artifacts** - Contract not compiled
4. **Environment files missing** - .env files not configured

### 📋 Complete Setup for New Computer

**Step-by-step process:**

```bash
# 1. Clone/copy the project
git clone <your-repo>
cd PROJECT-1

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install
cd ..

# 4. Install blockchain dependencies
cd blockchain
npm install
cd ..

# 5. Compile smart contracts
cd blockchain
npx hardhat compile
cd ..

# 6. Setup environment files
cp .env.local.example .env.local

# Create backend/.env with:
# MONGODB_URI=mongodb://localhost:27017/evidence-custody
# JWT_SECRET=your-secret-key
# PORT=5000

# 7. Clear any existing cache
rm -rf node_modules/.vite

# 8. Start development
npm run dev
```

## Common Errors and Solutions

### Error: "Cannot find module 'react'"

**Cause:** Dependencies not installed

**Solution:**
```bash
npm install
```

### Error: "Cannot find module './contracts/EvidenceChainOfCustody.json'"

**Cause:** Smart contract not compiled or artifacts not in correct location

**Solution:**
```bash
cd blockchain
npx hardhat compile
# Make sure artifacts are copied to src/contracts/
cd ..
```

### Error: "Module not found: Can't resolve 'crypto-js'"

**Cause:** Missing dependency

**Solution:**
```bash
npm install crypto-js
```

### Error: TypeScript errors with ethers library

**Cause:** TypeScript checking library internals

**Solution:** Already fixed in `tsconfig.json` with `"skipLibCheck": true`

### Error: "Port 5173 already in use"

**Cause:** Another Vite dev server running

**Solution:**
```bash
# Find and kill the process
# Windows:
netstat -ano | findstr :5173
taskkill /PID <pid> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

### Error: "ECONNREFUSED localhost:5000"

**Cause:** Backend server not running

**Solution:**
```bash
cd backend
node server.js
```

### Error: "MongooseServerSelectionError"

**Cause:** MongoDB not running or wrong connection string

**Solution:**
```bash
# Windows:
net start MongoDB

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Or use Docker:
docker run -d -p 27017:27017 mongo
```

### Error: "Contract not deployed at this address"

**Cause:** Smart contract needs to be deployed

**Solution:**
```bash
# Terminal 1: Start local blockchain
cd blockchain
npx hardhat node

# Terminal 2: Deploy contract
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

## Vite-Specific Issues

### Vite Cache Problems

Vite caches compiled modules in `node_modules/.vite/`. If this cache becomes stale or corrupted, you'll see import errors.

**Solution:**
```bash
# Delete the cache
rm -rf node_modules/.vite

# Or on Windows PowerShell:
Remove-Item -Recurse -Force node_modules/.vite

# Then restart dev server
npm run dev
```

### HMR (Hot Module Replacement) Not Working

**Solution:**
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

## System-Specific Issues

### Windows

1. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Path Issues**
   - Use forward slashes `/` or escaped backslashes `\\` in paths

### Mac/Linux

1. **Permission Issues**
   ```bash
   # If npm install fails with permission errors
   sudo chown -R $(whoami) ~/.npm
   ```

2. **Node Version Manager (nvm)**
   ```bash
   # Use correct Node version
   nvm use 18
   ```

## Verification Checklist

After setup, verify these work:

- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:5173
- [ ] No "Failed to resolve import" errors in console
- [ ] Backend starts: `cd backend && node server.js`
- [ ] Can access http://localhost:5000/api/health
- [ ] MongoDB is running
- [ ] MetaMask connects successfully

## Files That Should Exist After Setup

```
PROJECT-1/
├── node_modules/              ✅ (npm install)
├── backend/
│   ├── node_modules/          ✅ (npm install in backend)
│   └── .env                   ✅ (create manually)
├── blockchain/
│   ├── node_modules/          ✅ (npm install in blockchain)
│   └── artifacts/             ✅ (npx hardhat compile)
├── src/
│   └── contracts/
│       └── EvidenceChainOfCustody.json  ✅ (after deployment)
└── .env.local                 ✅ (copy from .env.local.example)
```

## Still Having Issues?

1. **Check Node.js version:**
   ```bash
   node --version  # Should be v16+ or v18+
   ```

2. **Clear everything and start fresh:**
   ```bash
   # Remove all dependencies
   rm -rf node_modules
   rm -rf backend/node_modules
   rm -rf blockchain/node_modules
   rm -rf node_modules/.vite
   
   # Reinstall
   npm install
   cd backend && npm install && cd ..
   cd blockchain && npm install && npx hardhat compile && cd ..
   
   # Start fresh
   npm run dev
   ```

3. **Check for conflicting global packages:**
   ```bash
   npm list -g --depth=0
   ```

4. **Update npm:**
   ```bash
   npm install -g npm@latest
   ```

## Getting Help

If you're still stuck:

1. Check the exact error message in browser console (F12)
2. Look for the specific import that's failing
3. Verify that module exists in `package.json`
4. Check if file exists in `node_modules/`
5. Review `SETUP_NEW_COMPUTER.md` for detailed setup

## Prevention

To avoid these issues when moving to a new computer:

1. ✅ Commit `package.json` and `package-lock.json` to git
2. ✅ Include `.env.local.example` and `backend/.env.example`
3. ✅ Document deployment steps
4. ❌ DON'T commit `node_modules/` (too large)
5. ❌ DON'T commit `.env` files (security risk)
6. ❌ DON'T commit `node_modules/.vite/` (cache)
