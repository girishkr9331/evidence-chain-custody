# Setup Scripts

## Creating an Admin Account

After deleting your database or starting fresh, you need to create an admin account.

### Method 1: Run the Setup Script (Recommended)

```bash
# From the project root directory
cd backend
node scripts/setup-admin.js
```

This will create an admin user with default credentials:
- **Address**: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266` (Hardhat Account #0)
- **Password**: `admin123`
- **Name**: System Administrator
- **Role**: ADMIN

**⚠️ IMPORTANT**: Change the password immediately after first login!

### Method 2: Customize the Admin

Edit `backend/scripts/setup-admin.js` and change the `adminData` object before running:

```javascript
const adminData = {
  address: '0xYOUR_WALLET_ADDRESS_HERE',
  password: 'YOUR_SECURE_PASSWORD',
  name: 'Your Name',
  role: 'ADMIN',
  department: 'Your Department'
};
```

### Method 3: Use MongoDB Directly

If you prefer, you can use MongoDB Compass or mongosh:

```javascript
use evidence-chain

db.users.insertOne({
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  password: '$2a$10$...',  // You'll need to bcrypt hash this
  name: 'System Administrator',
  role: 'ADMIN',
  department: 'IT Security',
  isActive: true,
  createdAt: new Date()
})
```

Note: The password needs to be bcrypt hashed. The script method is easier!

### Method 4: Use the Registration API

You can also register via the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "password": "admin123",
    "name": "System Administrator",
    "role": "ADMIN",
    "department": "IT Security"
  }'
```

## After Creating Admin

1. Login at `http://localhost:3000/login`
2. Use the wallet address and password you set
3. **Change your password** in the user settings
4. Create additional users as needed

## Troubleshooting

### "Admin user already exists"
- An admin already exists in the database
- Check with: `db.users.find({ role: 'ADMIN' })`
- Delete if needed: `db.users.deleteOne({ role: 'ADMIN' })`

### "Cannot connect to MongoDB"
- Ensure MongoDB is running
- Check MONGODB_URI in your `.env` file
- Default: `mongodb://localhost:27017/evidence-chain`

### Script doesn't run
- Make sure you're in the backend directory
- Ensure all dependencies are installed: `npm install`
- Check that backend/models/User.js exists
