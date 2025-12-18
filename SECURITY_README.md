# 🔒 Security Guidelines for Evidence Chain of Custody

## ⚠️ CRITICAL: Environment Variables Protection

### What Are Environment Variables?
Environment variables store sensitive information like:
- 🔑 Database passwords
- 🔐 API keys
- 🎫 JWT secrets
- 🌐 Private blockchain keys

**These should NEVER be committed to GitHub!**

---

## 📁 Environment Files in This Project

### `.env` - YOUR PRIVATE FILE ❌ DO NOT COMMIT
Contains your actual credentials. This file is:
- ✅ Ignored by Git (in `.gitignore`)
- ✅ Only on your local machine
- ❌ NEVER pushed to GitHub
- ❌ NEVER shared with others

**Location:** Project root directory

**Contains:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secret-key
PORT=5000
```

---

### `.env.example` - SAFE TEMPLATE ✅ SAFE TO COMMIT
A template showing what variables are needed WITHOUT actual values.

**Location:** Project root directory

**Contains:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=5000
```

**Purpose:** Help other developers know what environment variables they need to set up.

---

## 🛡️ Security Checklist

### Before Committing to GitHub:

- [ ] ✅ `.env` is listed in `.gitignore`
- [ ] ✅ `.env` is NOT showing in `git status`
- [ ] ✅ Run `git status` and verify `.env` is not there
- [ ] ✅ Only `.env.example` should be in Git
- [ ] ✅ JWT_SECRET is changed from default
- [ ] ✅ MongoDB connection string has YOUR password

### Verify .env is Protected:

```bash
# Check if .env is ignored
git check-ignore .env

# Should output: .env (meaning it's ignored ✅)

# Check what files will be committed
git status

# .env should NOT appear in the list
```

---

## 🚨 If You Accidentally Committed .env to GitHub

### IMMEDIATE ACTION REQUIRED:

#### 1. Remove from Git history
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

#### 2. Change ALL credentials immediately
- ❌ MongoDB password (create new user in MongoDB Atlas)
- ❌ JWT_SECRET (generate new random string)
- ❌ Any API keys
- ❌ Blockchain private keys

#### 3. Verify removal
```bash
# Check Git history for .env
git log --all --full-history -- .env

# If it appears, use BFG Repo Cleaner or git filter-branch
```

---

## 🔐 How to Generate Secure Secrets

### JWT Secret (Recommended Method)

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 2: Using PowerShell**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Option 3: Online Generator**
- https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

**Result:** Something like `Xk7mp9F2vN8qH4wL5zR3tY6uI0oP1aS2dF3gH4jK5lM=`

---

## 🌐 Environment Variables for Deployment

### Development (.env file)
```env
MONGODB_URI=mongodb://localhost:27017/evidence-custody
JWT_SECRET=dev-secret-change-in-production
PORT=5000
NODE_ENV=development
```

### Production (Set in hosting platform)

**Vercel (Frontend):**
```env
VITE_API_URL=https://your-backend.railway.app
VITE_CONTRACT_ADDRESS=0x123...
VITE_ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

**Railway/Render (Backend):**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/evidence-custody
JWT_SECRET=production-secret-very-long-and-random
PORT=5000
NODE_ENV=production
```

---

## 📖 Setting Up Environment Variables

### For New Developers:

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/evidence-chain-custody.git
   cd evidence-chain-custody
   ```

2. **Copy the example file**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env with your actual credentials**
   ```bash
   # Windows
   notepad .env
   
   # Mac/Linux
   nano .env
   ```

4. **Fill in your values**
   - Get MongoDB URI from MongoDB Atlas
   - Generate JWT_SECRET (see above)
   - Use default PORT (5000)

5. **NEVER commit .env**
   - It's already in .gitignore
   - Double-check with `git status`

---

## 🔍 Checking for Exposed Secrets

### Before Deploying:

```bash
# Search for potential secrets in code
grep -r "mongodb+srv://" --exclude-dir=node_modules .
grep -r "password" --exclude-dir=node_modules .
grep -r "secret" --exclude-dir=node_modules .

# Should only find references to process.env.VARIABLE_NAME
# NOT actual values!
```

### Tools to Scan for Secrets:

- **git-secrets**: https://github.com/awslabs/git-secrets
- **GitGuardian**: https://www.gitguardian.com/
- **TruffleHog**: https://github.com/trufflesecurity/truffleHog

---

## 🎯 Best Practices

### ✅ DO:
- Use environment variables for ALL sensitive data
- Keep `.env` in `.gitignore`
- Use different secrets for development and production
- Rotate secrets regularly (every 90 days)
- Use strong, random JWT secrets (32+ characters)
- Document required variables in `.env.example`

### ❌ DON'T:
- Commit `.env` to Git
- Share `.env` file via email/chat
- Use default/example secrets in production
- Hardcode credentials in source code
- Use the same secrets for dev and production
- Store secrets in browser localStorage (frontend)

---

## 🆘 Security Incident Response

### If Credentials Are Exposed:

1. **Immediately revoke/change ALL credentials**
2. **Check MongoDB Atlas access logs**
3. **Review GitHub commit history**
4. **Notify team members**
5. **Monitor for suspicious activity**
6. **Update credentials in all environments**

### MongoDB Atlas Security:
- Enable IP whitelist (don't use 0.0.0.0/0 in production)
- Use database-specific users (not admin)
- Enable audit logs
- Set up alerts for suspicious activity

---

## 📞 Security Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **MongoDB Security**: https://docs.mongodb.com/manual/security/
- **GitHub Security**: https://docs.github.com/en/code-security
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## ✅ Quick Security Audit

Run this checklist before every deployment:

```bash
# 1. Check .env is not tracked
git ls-files | grep .env

# Should return nothing (or only .env.example)

# 2. Verify .gitignore
cat .gitignore | grep .env

# Should show .env in the list

# 3. Check for hardcoded secrets
grep -r "mongodb+srv://" src/ backend/

# Should only find process.env references

# 4. Verify JWT secret strength
# Should be 32+ characters, random
```

---

**Remember: Security is not optional. Protect your credentials!** 🔒
