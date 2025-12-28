# Admin-Only Alert Resolution Guide

## Overview

Alert resolution has been restricted to **ADMIN users only**. This ensures that only authorized administrators can resolve security alerts, maintaining proper security controls.

## Changes Made

### 1. **Backend - Added ADMIN Role**

**File**: `backend/models/User.js`

Added `ADMIN` to the list of available roles:

```javascript
role: {
  type: String,
  enum: ['ADMIN', 'POLICE', 'INVESTIGATOR', 'FORENSIC_LAB', 'COURT', 'CYBER_UNIT'],
  required: true
}
```

### 2. **Backend - Protected Alert Resolution Endpoint**

**File**: `backend/routes/alerts.js`

Added role-based middleware to restrict alert resolution:

```javascript
// Mark alert as resolved (ADMIN only)
router.patch('/:alertId/resolve', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  // ... resolution logic
})

// Delete alert (ADMIN only)
router.delete('/:alertId', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  // ... deletion logic
})
```

### 3. **Frontend - Added isAdmin() Helper**

**File**: `src/context/AuthContext.tsx`

Added helper function to check if current user is admin:

```typescript
const isAdmin = () => {
  return user?.role === 'ADMIN'
}
```

### 4. **Frontend - Conditional Resolve Button**

**File**: `src/pages/Alerts.tsx`

The "Resolve" button now only appears for admin users:

```tsx
{!alert.resolved && isAdmin() && (
  <div className="ml-4">
    <button onClick={() => handleResolveAlert(alert.id)}>
      Resolve
    </button>
  </div>
)}
```

## User Experience

### For Admin Users
- ✅ Can see "Resolve" button on unresolved alerts
- ✅ Can click to resolve alerts
- ✅ Alert is marked as resolved in both blockchain and database

### For Non-Admin Users
- ❌ "Resolve" button is **not visible**
- ℹ️ Can view alerts and their status
- ℹ️ Cannot modify alert status

## Testing Guide

### Step 1: Create Admin User

```bash
# Using MongoDB shell or Compass, create a user with ADMIN role
{
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "password": "hashedPassword", // Use bcrypt
  "name": "System Administrator",
  "role": "ADMIN",
  "department": "IT Security",
  "isActive": true
}
```

Or use the registration endpoint:

```javascript
POST /api/auth/register
{
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "password": "AdminPassword123",
  "name": "System Administrator",
  "role": "ADMIN",
  "department": "IT Security"
}
```

### Step 2: Create Non-Admin User

```javascript
POST /api/auth/register
{
  "address": "0xabcdef1234567890abcdef1234567890abcdef12",
  "password": "Password123",
  "name": "Investigator John",
  "role": "INVESTIGATOR",
  "department": "Criminal Investigation"
}
```

### Step 3: Test Admin Access

1. **Login as Admin**
   ```javascript
   POST /api/auth/login
   {
     "address": "0x1234567890abcdef1234567890abcdef12345678",
     "password": "AdminPassword123"
   }
   ```

2. **Navigate to Alerts page**
   - You should see the "Resolve" button on unresolved alerts

3. **Click "Resolve"**
   - Alert should be marked as resolved
   - Success message appears
   - Alert moves to "Resolved" filter

### Step 4: Test Non-Admin Access

1. **Logout and login as Investigator**
   ```javascript
   POST /api/auth/login
   {
     "address": "0xabcdef1234567890abcdef1234567890abcdef12",
     "password": "Password123"
   }
   ```

2. **Navigate to Alerts page**
   - You should **NOT** see the "Resolve" button
   - Alerts are visible but read-only

3. **Try to resolve via API (should fail)**
   ```javascript
   PATCH /api/alerts/1/resolve
   Authorization: Bearer <investigator-token>
   
   // Response: 403 Forbidden
   {
     "message": "Insufficient permissions"
   }
   ```

## API Responses

### Success (Admin User)

```javascript
PATCH /api/alerts/1/resolve
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "success": true,
  "message": "Alert resolved successfully",
  "alert": {
    "alertId": 1,
    "resolved": true,
    "resolvedBy": "0x1234...",
    "resolvedAt": 1703721234
  }
}
```

### Failure (Non-Admin User)

```javascript
PATCH /api/alerts/1/resolve
Authorization: Bearer <non-admin-token>

Response: 403 Forbidden
{
  "message": "Insufficient permissions"
}
```

### Failure (No Authentication)

```javascript
PATCH /api/alerts/1/resolve

Response: 401 Unauthorized
{
  "message": "Authentication required"
}
```

## Security Features

### Backend Protection
✅ **Role-based middleware** - Checks user role before allowing access  
✅ **JWT authentication** - Verifies user identity  
✅ **Database validation** - User role stored in database  

### Frontend Protection
✅ **UI hiding** - Resolve button not rendered for non-admins  
✅ **Context-based checks** - Uses AuthContext for role verification  
✅ **Clean UX** - No disabled buttons, just hide them  

## Database Schema

### User Role Field

```javascript
{
  _id: ObjectId,
  address: String,
  name: String,
  role: String, // 'ADMIN', 'POLICE', 'INVESTIGATOR', etc.
  department: String,
  isActive: Boolean
}
```

### Alert with Resolution

```javascript
{
  alertId: Number,
  evidenceId: String,
  alertType: String,
  message: String,
  timestamp: Number,
  resolved: Boolean,        // false -> true when resolved
  resolvedBy: String,       // Wallet address of admin who resolved it
  resolvedAt: Number        // Unix timestamp when resolved
}
```

## Troubleshooting

### "Resolve button not showing for admin"

**Check:**
1. User role in database is `"ADMIN"` (case-sensitive)
2. User is logged in with valid JWT token
3. `isAdmin()` function returns true in console: `console.log(isAdmin())`
4. Browser console for any errors

### "403 Forbidden when resolving"

**Check:**
1. Token is valid and not expired
2. User role in database is `"ADMIN"`
3. Backend middleware is properly configured
4. Check backend logs for permission errors

### "Button showing for non-admin"

**Check:**
1. Clear browser cache and reload
2. Verify user role in localStorage: `JSON.parse(localStorage.getItem('user'))`
3. Check if AuthContext is providing correct user data

## Best Practices

1. **Create at least one admin user** during initial setup
2. **Use strong passwords** for admin accounts
3. **Audit admin actions** - Check who resolved what
4. **Limit admin users** - Only give admin role to trusted personnel
5. **Regular reviews** - Periodically review who has admin access

## Future Enhancements

Potential improvements for the future:

- [ ] **Audit log for resolutions** - Track who resolved which alert
- [ ] **Resolution comments** - Allow admins to add notes when resolving
- [ ] **Bulk resolution** - Resolve multiple alerts at once
- [ ] **Re-open alerts** - Allow admins to re-open resolved alerts
- [ ] **Email notifications** - Notify admins of new critical alerts
- [ ] **Admin dashboard** - Dedicated view for admin functions
- [ ] **Role hierarchy** - Multiple admin levels with different permissions

## Summary

✅ **Admin role added** to user model  
✅ **Backend protected** with role-based middleware  
✅ **Frontend updated** to check admin status  
✅ **Resolve button** only visible to admins  
✅ **API endpoints** return 403 for non-admins  
✅ **Clean UX** - Button hidden (not disabled) for non-admins  

Only users with `role: "ADMIN"` can resolve security alerts!
