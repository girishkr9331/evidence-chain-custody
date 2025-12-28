# Admin Account Setup Guide

## Quick Setup (After Database Reset)

If you've deleted your database and want to start fresh, follow these simple steps:

### Step 1: Ensure MongoDB is Running

```bash
# Check if MongoDB is running
mongosh
# If it connects, you're good! Type 'exit' to close

# If not running, start MongoDB
# On Windows:
net start MongoDB

# On macOS/Linux:
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Step 2: Create Admin Account

Run the setup script:

```bash
npm run setup-admin
```

This creates an admin user with these **default credentials**:

| Field | Value |
|-------|-------|
| **Wallet Address** | `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266` |
| **Password** | `admin123` |
| **Name** | System Administrator |
| **Role** | ADMIN |
| **Department** | IT Security |

> ⚠️ **IMPORTANT**: This uses Hardhat's default test account #0. Change the password immediately after logging in!

### Step 3: Login

1. Make sure your backend server is running:
   ```bash
   npm run server
   ```

2. Open your frontend:
   ```bash
   npm run dev
   ```

3. Navigate to: `http://localhost:3000/login`

4. Connect your MetaMask to **Hardhat Network** (localhost:8545)

5. Import the test account into MetaMask:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

6. Login with:
   - Wallet Address: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
   - Password: `admin123`

### Step 4: Secure Your Admin Account

After first login:
1. Go to User Settings/Profile
2. Change your password to something secure
3. Consider creating a dedicated admin wallet address

---

## Custom Admin Setup

If you want to use a different wallet address:

### Method 1: Edit the Script

1. Open `backend/scripts/setup-admin.js`
2. Modify the `adminData` object:

```javascript
const adminData = {
  address: '0xYOUR_WALLET_ADDRESS',  // Your actual wallet
  password: 'YourSecurePassword123',  // Strong password
  name: 'Your Name',
  role: 'ADMIN',
  department: 'Your Department'
};
```

3. Run: `npm run setup-admin`

### Method 2: Use the API Directly

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xYOUR_WALLET_ADDRESS",
    "password": "YourSecurePassword",
    "name": "Admin Name",
    "role": "ADMIN",
    "department": "IT Security"
  }'
```

---

## Troubleshooting

### "Admin user already exists"

An admin is already in the database. Options:

1. **Login with existing admin** (if you know the credentials)
2. **Delete and recreate**:
   ```bash
   mongosh
   use evidence-chain
   db.users.deleteOne({ role: 'ADMIN' })
   exit
   npm run setup-admin
   ```

### "Cannot connect to MongoDB"

- Ensure MongoDB is running
- Check your `.env` file has correct `MONGODB_URI`
- Default: `mongodb://localhost:27017/evidence-chain`

### MetaMask Connection Issues

1. Add Hardhat Network to MetaMask:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import the test account using the private key above

3. Make sure blockchain is running: `npm run blockchain`

### "Invalid credentials" on login

- Double-check the wallet address (must match exactly)
- Ensure password is correct
- Verify the user was created: `db.users.find({ role: 'ADMIN' }).pretty()`

---

## Complete Fresh Start Checklist

Starting completely from scratch? Here's the full sequence:

```bash
# 1. Start MongoDB
mongosh
use evidence-chain
db.dropDatabase()  # Deletes everything
exit

# 2. Start Hardhat blockchain
npm run blockchain
# Keep this terminal open

# In a new terminal:
# 3. Deploy smart contracts
npm run deploy

# 4. Create admin user
npm run setup-admin

# 5. Start backend server
npm run server
# Keep this terminal open

# In a new terminal:
# 6. Start frontend
npm run dev

# 7. Open browser and login!
```

---

## Available User Roles

When creating additional users, these roles are available:

- **ADMIN** - Full system access, user management
- **POLICE** - Upload evidence, transfer custody
- **INVESTIGATOR** - Access and analyze evidence
- **FORENSIC_LAB** - Forensic analysis capabilities
- **COURT** - Read-only access for legal proceedings
- **CYBER_UNIT** - Digital forensics and cyber investigation

---

## Next Steps

After setting up admin:

1. ✅ Login and test the system
2. ✅ Change default password
3. ✅ Create additional user accounts
4. ✅ Upload test evidence
5. ✅ Test blockchain integration
6. ✅ Configure your production environment

Need help? Check the main README.md or TROUBLESHOOTING.md
