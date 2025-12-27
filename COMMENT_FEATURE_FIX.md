# 🔧 Comment Feature Fix - Authentication Issue

## ❌ Problem Identified

The comment feature was failing because the authentication token wasn't being sent with API requests.

**Root Cause:**
- `AuthContext.tsx` was setting the token on the default `axios` instance
- `commentService.ts` was using a different axios instance from `api.ts`
- Result: API requests had no auth token, causing "Authentication required" errors

---

## ✅ Fix Applied

I've updated the authentication system to use **axios interceptors**:

### Changes Made:

1. **`src/config/api.ts`** - Added request/response interceptors
   - Automatically adds `Authorization` header to all requests
   - Reads token from localStorage on every request
   - Handles 401 errors (expired tokens)

2. **`src/context/AuthContext.tsx`** - Updated to use the api instance
   - Removed manual header setting
   - Simplified authentication flow
   - All auth requests now use the configured api instance

---

## 🚀 How to Test

### Step 1: Restart Your Frontend
```bash
# Stop the frontend (Ctrl+C)
npm run dev
```

### Step 2: Clear Browser Cache
- Press `F12` to open DevTools
- Right-click the refresh button → "Empty Cache and Hard Reload"
- Or use `Ctrl+Shift+Delete` to clear cache

### Step 3: Login to Your Application
1. Go to your app
2. Click **Login**
3. Enter your credentials
4. Login successfully

### Step 4: Test Comments
1. Navigate to any **Evidence Details** page
2. Scroll to the **Discussion** section
3. Type a comment
4. Click **Post Comment**
5. ✅ Comment should post successfully!

---

## 🔍 Verify It's Working

### Check 1: Browser Console (F12)
- Should see no errors
- Network tab should show requests with `Authorization: Bearer <token>`

### Check 2: Comment Posting
- Can type and post comments ✅
- Can see existing comments ✅
- Can edit your comments ✅
- Can delete your comments ✅

### Check 3: Evidence Tagging
- Can search and tag evidence ✅
- Tagged evidence shows as blue badges ✅

### Check 4: User Tagging
- Can search and tag users ✅
- Tagged users show as purple badges ✅

---

## 🐛 Troubleshooting

### Issue: Still Getting "Failed to fetch comments"

**Solution 1: Clear Browser Storage**
1. Press `F12` → Go to **Application** tab
2. Click **Storage** → "Clear site data"
3. Refresh page (F5)
4. Login again

**Solution 2: Check Backend is Running**
```powershell
# Check if backend is on port 5000
netstat -ano | findstr "5000"

# Test health endpoint
curl http://localhost:5000/api/health
```

**Solution 3: Check MongoDB Connection**
- Make sure MongoDB is running
- Check backend terminal for "✅ MongoDB connected successfully"

### Issue: "Authentication required" error

**Check if you're logged in:**
1. Open DevTools (F12) → Console
2. Type: `localStorage.getItem('token')`
3. Should return a long string (JWT token)
4. If null → You're not logged in, login first

**Solution:**
- Click **Login** in your app
- Enter valid credentials
- Make sure you see "Login successful!" toast

### Issue: Can see comments but can't post

**This means:**
- ✅ Backend is working
- ✅ API calls work
- ❌ You're not logged in

**Solution:**
- Check top-right corner of your app
- Should show your username/address
- If not shown → Click "Login"

---

## 📋 Testing Checklist

Before reporting issues, verify:

- [ ] Frontend is running (`npm run dev`)
- [ ] Backend is running (`node backend/server.js`)
- [ ] MongoDB is connected (check backend logs)
- [ ] You are logged in (see username in app)
- [ ] Browser cache cleared
- [ ] No errors in browser console (F12)

---

## 🎯 What Should Work Now

### ✅ Reading Comments (No Auth Required)
- View all comments on evidence
- See comment statistics
- View threaded replies
- See tagged evidence and users

### ✅ Writing Comments (Auth Required)
- Post new comments
- Reply to comments
- Edit your own comments
- Delete your own comments
- Tag evidence items
- Tag other users

---

## 💡 How the Fix Works

### Before (Broken):
```
AuthContext sets token → axios.defaults ❌
CommentService uses → api.ts (different instance) ❌
Result: No token sent with requests ❌
```

### After (Fixed):
```
AuthContext saves token → localStorage ✅
api.ts interceptor → reads token from localStorage ✅
CommentService uses → api.ts (with interceptor) ✅
Result: Token automatically sent with all requests ✅
```

---

## 🔐 Security Note

The axios interceptor:
- Automatically adds token to ALL requests
- Reads fresh token from localStorage every time
- Handles expired tokens (removes them)
- Ensures secure authentication flow

---

## 📝 Technical Details

### Request Interceptor:
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**What it does:**
1. Runs before every API request
2. Gets token from localStorage
3. Adds it to Authorization header
4. Sends request with token

### Response Interceptor:
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)
```

**What it does:**
1. Runs after every API response
2. If 401 error (unauthorized) → clears token
3. Prevents using expired tokens

---

## ✅ Expected Behavior After Fix

### Login Flow:
1. User logs in
2. Token saved to localStorage
3. AuthContext updates state
4. All subsequent requests include token

### Comment Flow:
1. User types comment
2. Clicks "Post Comment"
3. Interceptor adds token to request
4. Backend verifies token
5. Comment posted successfully
6. Comment appears in list

### Logout Flow:
1. User logs out
2. Token removed from localStorage
3. Future requests won't have token
4. User can read but not post comments

---

## 🆘 Still Not Working?

Run this diagnostic in browser console (F12):

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'))

// Check if user exists
console.log('User:', localStorage.getItem('user'))

// Test API call
fetch('http://localhost:5000/api/comments/evidence/EV001')
  .then(r => r.json())
  .then(d => console.log('Comments:', d))
  .catch(e => console.error('Error:', e))
```

**Expected output:**
- Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (long string)
- User: {"id":"...","address":"...","name":"..."}
- Comments: [] (array, even if empty)

---

**The fix is applied! Just restart your frontend and clear cache to see it working!** 🚀
