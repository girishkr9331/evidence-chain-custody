# Setup Guide for New Computer

## Common "Pre-transform Error" / "Failed to Resolve Import" Issues

This error typically occurs when moving the project to a new computer due to missing dependencies or configuration.

## ⚠️ Common Causes

1. **Missing node_modules** - Not installed or incomplete
2. **Different Node.js version** - Version mismatch
3. **Missing environment files** - .env files not copied
4. **Cache issues** - Old Vite cache causing problems
5. **Missing contract artifacts** - Smart contract not compiled
6. **Git ignored files** - Critical files not in version control

## ✅ Complete Setup Checklist

### Step 1: Verify Prerequisites

```bash
# Check Node.js version (should be 16+ or 18+)
node --version

# Check npm version
npm --version

# Check if Git is installed (optional but recommended)
git --version
```

**Required Versions:**
- Node.js: v16.x or v18.x or higher
- npm: v8.x or higher

### Step 2: Install Dependencies

```bash
# Clean install all frontend dependencies
npm install

# If you get errors, try:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install blockchain dependencies
cd blockchain
npm install
cd ..
```

### Step 3: Setup Environment Files

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and add your values
# VITE_API_URL=http://localhost:5000/api
```

**Backend Environment (.env in backend folder):**
```env
MONGODB_URI=mongodb://localhost:27017/evidence-custody
JWT_SECRET=your-secret-key-here
PORT=5000
```

### Step 4: Compile Smart Contracts

```bash
cd blockchain

# Compile contracts
npx hardhat compile

# This creates artifacts in:
# - blockchain/artifacts/
# - src/contracts/ (if configured)

cd ..
```

### Step 5: Deploy Smart Contract (If Needed)

```bash
# Start local blockchain
cd blockchain
npx hardhat node

# In another terminal, deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Copy the contract address output and update:
# src/contracts/EvidenceChainOfCustody.json

cd ..
```

### Step 6: Start MongoDB

```bash
# Windows (if installed as service)
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 mongo
```

### Step 7: Clear Vite Cache

```bash
# Remove Vite cache
rm -rf node_modules/.vite

# Or on Windows PowerShell
Remove-Item -Recurse -Force node_modules/.vite
```

### Step 8: Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
node server.js

# Terminal 2: Start frontend
npm run dev

# Terminal 3 (optional): Start blockchain
cd blockchain
npx hardhat node
```

## 🔍 Debugging Specific Errors

### Error: "Cannot find module 'react'"
```bash
npm install react react-dom
```

### Error: "Cannot find module 'ethers'"
```bash
npm install ethers@^6.9.0
```

### Error: "Failed to resolve import './contracts/EvidenceChainOfCustody.json'"
```bash
cd blockchain
npx hardhat compile
# Then copy artifacts to src/contracts/
```

### Error: "Module not found: Error: Can't resolve 'crypto-js'"
```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

### Error: TypeScript errors with ethers
```bash
# Add to tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

## 📋 Files That Should NOT Be Copied (Git Ignored)

These files/folders should be regenerated on each computer:

- `node_modules/` - Run `npm install`
- `backend/node_modules/` - Run `npm install` in backend
- `blockchain/node_modules/` - Run `npm install` in blockchain
- `.vite/` - Vite cache, auto-generated
- `dist/` - Build output
- `.env.local` - Create from `.env.local.example`
- `backend/.env` - Create manually with your values

## 📦 Files That SHOULD Be in Version Control

Make sure these exist in your repository:

- `package.json` ✅
- `package-lock.json` ✅
- `tsconfig.json` ✅
- `vite.config.ts` ✅
- `.env.local.example` ✅
- `backend/package.json` ✅
- `blockchain/package.json` ✅
- `blockchain/contracts/*.sol` ✅
- All `src/` files ✅

## 🚀 Quick Setup Script (Windows PowerShell)

Save as `setup-new-computer.ps1`:

```powershell
Write-Host "Setting up Evidence Chain Custody..." -ForegroundColor Cyan

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
node --version

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install
cd ..

# Install blockchain dependencies
Write-Host "Installing blockchain dependencies..." -ForegroundColor Yellow
cd blockchain
npm install
npx hardhat compile
cd ..

# Create environment files if they don't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "⚠️ Please edit .env.local with your configuration" -ForegroundColor Red
}

# Clear Vite cache
Write-Host "Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local with your configuration" -ForegroundColor White
Write-Host "2. Start MongoDB: net start MongoDB" -ForegroundColor White
Write-Host "3. Start backend: cd backend && node server.js" -ForegroundColor White
Write-Host "4. Start frontend: npm run dev" -ForegroundColor White
```

## 🚀 Quick Setup Script (Mac/Linux)

Save as `setup-new-computer.sh`:

```bash
#!/bin/bash

echo "Setting up Evidence Chain Custody..."

# Check Node.js
echo "Checking Node.js..."
node --version

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install blockchain dependencies
echo "Installing blockchain dependencies..."
cd blockchain
npm install
npx hardhat compile
cd ..

# Create environment files if they don't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "⚠️ Please edit .env.local with your configuration"
fi

# Clear Vite cache
echo "Clearing Vite cache..."
rm -rf node_modules/.vite

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Start MongoDB"
echo "3. Start backend: cd backend && node server.js"
echo "4. Start frontend: npm run dev"
```

## 🆘 Still Having Issues?

### Check these common problems:

1. **Port already in use**
   - Frontend (5173): Kill process using that port
   - Backend (5000): Check if another app is running
   - MongoDB (27017): Check if MongoDB is already running

2. **Permission issues**
   - Run terminal as Administrator (Windows)
   - Use `sudo` for npm global installs (Mac/Linux)

3. **Firewall blocking**
   - Allow Node.js through firewall
   - Check antivirus isn't blocking

4. **Wrong working directory**
   - Make sure you're in the project root
   - Check `pwd` (Mac/Linux) or `cd` (Windows)

5. **Corrupted cache**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `npm run dev` starts without errors
- [ ] Backend starts: `cd backend && node server.js`
- [ ] Can access http://localhost:5173
- [ ] Can access http://localhost:5000/api/health
- [ ] MongoDB is running and accessible
- [ ] No "Failed to resolve import" errors
- [ ] MetaMask connects successfully
- [ ] Can upload evidence
- [ ] Can verify evidence

## 📞 Need Help?

If you're still seeing errors after following this guide:

1. Check the exact error message in the console
2. Look for the specific import that's failing
3. Verify that module is in package.json
4. Try `npm install <module-name>` for that specific module
5. Check Node.js and npm versions match requirements
