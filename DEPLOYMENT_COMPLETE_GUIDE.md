# Complete Free Deployment Guide - Evidence Chain of Custody

## 🌍 Deploy Your App to the World - 100% FREE

This guide will help you deploy your blockchain-based evidence management system completely free using popular hosting platforms.

---

## 📋 Prerequisites

Before starting, create accounts on these platforms (all free):
- [ ] GitHub account
- [ ] Vercel account (for frontend)
- [ ] Railway/Render account (for backend)
- [ ] MongoDB Atlas account (for database)
- [ ] Alchemy/Infura account (for blockchain)

---

## Part 1: Prepare Your Code for Deployment

### Step 1: Initialize Git Repository

```bash
# Initialize git if not already done
git init

# Add .gitignore to protect sensitive data
echo "node_modules/
.env
.env.local
dist/
build/
*.log" > .gitignore

# Commit your code
git add .
git commit -m "Initial commit - Ready for deployment"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `evidence-chain-custody`)
3. **Don't** initialize with README (you already have code)
4. Copy the repository URL

```bash
# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/evidence-chain-custody.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Smart Contract to Public Testnet

### Step 3: Get Free Testnet ETH

**Sepolia Testnet (Recommended)**

1. Go to https://sepoliafaucet.com/
2. Or https://www.alchemy.com/faucets/ethereum-sepolia
3. Enter your MetaMask wallet address
4. Get free test ETH (0.5 ETH)

### Step 4: Setup Alchemy for Blockchain Connection

1. Go to https://www.alchemy.com/
2. Click "Sign Up" → Create free account
3. Click "Create App"
   - Name: `Evidence Chain`
   - Chain: `Ethereum`
   - Network: `Sepolia`
4. Click "View Key" → Copy the **HTTPS URL**
5. Save this URL (e.g., `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

### Step 5: Update Hardhat Config for Testnet

Update `blockchain/hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  }
};
```

Create `blockchain/.env`:

```env
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_metamask_private_key_here
```

⚠️ **Get Private Key from MetaMask:**
1. Open MetaMask
2. Click three dots → Account Details
3. Click "Show Private Key"
4. Enter password → Copy key
5. **NEVER share this or commit to GitHub!**

### Step 6: Deploy Smart Contract to Sepolia

```bash
cd blockchain

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

📝 **Save the output!** You'll see:
```
EvidenceChainOfCustody deployed to: 0xABCD1234...
```

**Copy this contract address!** You'll need it in Step 8.

---

## Part 3: Deploy Database (MongoDB Atlas)

### Step 7: Setup Free MongoDB Database

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a **FREE Cluster**:
   - Provider: **AWS**
   - Region: Choose closest to you
   - Cluster Tier: **M0 Sandbox (FREE)**
   - Cluster Name: `evidence-chain`
4. Click "Create Cluster" (takes 3-5 minutes)

### Step 8: Configure Database Access

**Create Database User:**
1. Click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Authentication: **Password**
4. Username: `evidenceuser`
5. Password: Click "Autogenerate Secure Password" → **COPY IT!**
6. Database User Privileges: **Read and write to any database**
7. Click "Add User"

**Whitelist IP Addresses:**
1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for deployment)
4. Click "Confirm"

### Step 9: Get MongoDB Connection String

1. Click "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**
5. Copy the connection string:
```
mongodb+srv://evidenceuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
6. Replace `<password>` with the password from Step 8
7. Add database name: `evidence-custody`

Final string looks like:
```
mongodb+srv://evidenceuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/evidence-custody?retryWrites=true&w=majority
```

---

## Part 4: Deploy Backend (Railway or Render)

### Option A: Deploy Backend on Railway (Recommended - Easier)

#### Step 10: Deploy to Railway

1. Go to https://railway.app/
2. Click "Login" → Sign in with GitHub
3. Click "New Project"
4. Click "Deploy from GitHub repo"
5. Select your repository
6. Click "Add variables" and add these **Environment Variables**:

```env
MONGODB_URI=mongodb+srv://evidenceuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/evidence-custody?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-change-this
PORT=5000
NODE_ENV=production
```

7. Click "Settings" → Change **Root Directory** to `./` (if backend is in root)
8. If backend is in a folder, set Root Directory to `/backend`
9. Railway will auto-deploy!
10. Click on your deployment → Copy the **Public Domain** URL
11. Example: `https://evidence-chain-backend.up.railway.app`

### Option B: Deploy Backend on Render (Alternative)

#### Step 10B: Deploy to Render

1. Go to https://render.com/
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: `evidence-chain-backend`
   - Environment: **Node**
   - Build Command: `npm install`
   - Start Command: `node server.js` (or `node backend/server.js` if in subfolder)
   - Instance Type: **Free**
6. Add Environment Variables (same as Railway above)
7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Copy your backend URL: `https://evidence-chain-backend.onrender.com`

---

## Part 5: Deploy Frontend (Vercel)

### Step 11: Prepare Frontend Environment

Update `src/config/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.railway.app'
export default axios
```

Create `.env.production` in project root:

```env
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_CONTRACT_ADDRESS=0xYourContractAddressFromStep6
VITE_ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

Update `src/context/Web3Context.tsx` to use environment variables:

```typescript
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x...'
```

### Step 12: Deploy to Vercel

1. Go to https://vercel.com/
2. Click "Sign Up" → Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure Project:
   - Framework Preset: **Vite**
   - Root Directory: `./` (or leave default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables (copy from `.env.production`):
   - `VITE_API_URL`
   - `VITE_CONTRACT_ADDRESS`
   - `VITE_ALCHEMY_URL`
7. Click "Deploy"
8. Wait 2-3 minutes
9. Your app will be live at: `https://your-app.vercel.app`

### Step 13: Update Backend CORS

Update `backend/server.js` to allow your Vercel domain:

```javascript
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  'https://your-app.vercel.app',  // Add your Vercel URL
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

Commit and push:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

Railway/Render will auto-redeploy!

---

## Part 6: Final Configuration & Testing

### Step 14: Configure MetaMask for Users

Users need to:
1. Install MetaMask browser extension
2. Switch to **Sepolia Test Network**:
   - Open MetaMask
   - Click network dropdown (top)
   - Enable "Show test networks" in settings
   - Select "Sepolia test network"
3. Get free test ETH from faucet (Step 3)

### Step 15: Create First Admin User

From your deployed frontend:

1. Visit your app: `https://your-app.vercel.app`
2. Connect MetaMask
3. Go to Register page
4. Create first admin user:
   - Wallet Address: (auto-filled from MetaMask)
   - Name: Your Name
   - Role: POLICE
   - Department: Administration
   - Password: Create strong password

### Step 16: Test Complete Flow

**Test Evidence Upload:**
1. Login to your app
2. Navigate to "Upload Evidence"
3. Fill form and upload a test file
4. Wait for blockchain confirmation
5. Check Evidence List - should appear!

**Test Audit Trail:**
1. Go to Audit Trail page
2. Should see your upload action
3. Disconnect wallet and refresh
4. Audit logs should STILL be visible! ✅

**Test User Management:**
1. Go to User Management
2. Add a new user
3. Check MongoDB Atlas → Collections → `users`
4. User should be in database! ✅

---

## Part 7: Custom Domain (Optional)

### Step 17: Add Custom Domain to Vercel

If you have a domain (e.g., from Namecheap, GoDaddy, or free from Freenom):

1. In Vercel, go to your project
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `evidencechain.com`)
4. Follow DNS configuration instructions
5. Add these DNS records:
   - Type: `A` → Value: `76.76.21.21`
   - Type: `CNAME` → Name: `www` → Value: `cname.vercel-dns.com`
6. Wait 24-48 hours for DNS propagation

---

## 📊 Deployment Checklist

### Before Going Live:

- [ ] Smart contract deployed to Sepolia testnet
- [ ] Contract address saved and added to frontend env
- [ ] MongoDB Atlas cluster created and running
- [ ] Database connection string configured
- [ ] Backend deployed to Railway/Render
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] CORS configured for production domain
- [ ] First admin user created
- [ ] Test evidence upload working
- [ ] Audit trail persisting after wallet disconnect
- [ ] User management syncing to database

### Security Checklist:

- [ ] `.env` files NOT committed to GitHub
- [ ] Private keys secured (never shared)
- [ ] JWT secret is strong and unique
- [ ] MongoDB user has limited permissions
- [ ] CORS only allows your domains
- [ ] All API endpoints tested

---

## 🔗 Your Live URLs

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://your-app.vercel.app` | User interface |
| **Backend API** | `https://your-backend.railway.app` | REST API server |
| **Database** | MongoDB Atlas Console | Database management |
| **Smart Contract** | Sepolia Etherscan | Blockchain verification |

---

## 📱 Share Your App

Once deployed, users can access your app by:

1. **Going to your URL**: `https://your-app.vercel.app`
2. **Installing MetaMask**: https://metamask.io/
3. **Switching to Sepolia testnet**
4. **Getting test ETH**: https://sepoliafaucet.com/
5. **Registering an account** on your app

---

## 🆘 Troubleshooting

### Frontend shows "Network Error"
- Check if backend is running (visit `your-backend-url/api/health`)
- Verify `VITE_API_URL` in Vercel environment variables
- Check browser console for CORS errors

### "Transaction failed" errors
- Ensure user has Sepolia ETH in MetaMask
- Verify contract address is correct
- Check Sepolia network is selected in MetaMask

### Database connection failed
- Verify MongoDB connection string is correct
- Check if IP whitelist includes "0.0.0.0/0" (allow all)
- Ensure database user password is correct

### "Audit logs not appearing"
- Check backend logs in Railway/Render
- Verify `/api/audit-logs` endpoint is accessible
- Test with Postman/Thunder Client

---

## 💰 Cost Breakdown (All FREE!)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | FREE | 100GB bandwidth/month |
| **Railway** | Free Tier | FREE | $5 credit/month (enough for this app) |
| **MongoDB Atlas** | M0 Sandbox | FREE | 512MB storage |
| **Alchemy** | Free | FREE | 300M requests/month |
| **Sepolia Testnet** | Testnet | FREE | Unlimited (test network) |

**Total Monthly Cost: $0.00** 🎉

---

## 🚀 Next Steps (Optional Upgrades)

### When You're Ready for Production:

1. **Deploy to Mainnet** (Ethereum mainnet - requires real ETH)
2. **Upgrade to paid hosting** (for better performance)
3. **Add custom domain** (professional look)
4. **Implement CI/CD** (automated deployments)
5. **Add monitoring** (Sentry for error tracking)
6. **Scale database** (upgrade MongoDB cluster)

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app/
- **MongoDB Docs**: https://docs.mongodb.com/
- **Hardhat Docs**: https://hardhat.org/docs
- **Alchemy Docs**: https://docs.alchemy.com/

---

## ✅ Congratulations!

Your Evidence Chain of Custody app is now live and accessible worldwide! 🌍

Share your URL with the world: `https://your-app.vercel.app`

**Remember**: This is deployed on a TEST network (Sepolia). For production use with real evidence, you'll need to:
1. Deploy to Ethereum mainnet
2. Implement proper security audits
3. Add legal compliance features
4. Setup proper backup systems

---

**Need Help?** Drop your deployment URL and any errors in the chat!
