# Case Closure Feature Guide

## Overview

The case closure feature allows authorized users (current custodian or admin) to close evidence cases when investigations are complete. This ensures proper case management and maintains a clear audit trail.

## Key Features

✅ **Restricted Access** - Only current custodian or admin can close cases  
✅ **Mandatory Reason** - Closure reason must be provided  
✅ **Visual Indicators** - Clear badge showing case status (Open/Closed)  
✅ **Database Persistence** - Case status stored in MongoDB  
✅ **Audit Trail** - Tracks who closed the case and when  
✅ **Admin Reopen** - Admins can reopen closed cases if needed  

## Architecture

### Backend Implementation

#### 1. Database Schema (Evidence Model)

```javascript
{
  evidenceId: String,
  caseId: String,
  currentCustodian: String,        // Track current evidence custodian
  caseStatus: {
    type: String,
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN'
  },
  closedBy: String,                // Who closed the case
  closedAt: Date,                  // When case was closed
  closureReason: String            // Why case was closed
}
```

#### 2. API Endpoints

**Close Case**
```
PATCH /api/evidence/:id/close
Authorization: Bearer <token>
Body: { closureReason: "Investigation complete" }

Permission: Current custodian OR Admin
```

**Reopen Case**
```
PATCH /api/evidence/:id/reopen
Authorization: Bearer <token>

Permission: Admin only
```

### Frontend Implementation

#### 1. Permission Check

```typescript
const canCloseCase = () => {
  if (!user || !evidence) return false
  
  // Check if case is already closed
  if (evidence.caseStatus === 'CLOSED') return false
  
  // Admin can always close
  if (isAdmin()) return true
  
  // Current custodian can close
  const userAddress = user.address.toLowerCase()
  const custodian = evidence.currentCustodian?.toLowerCase()
  return userAddress === custodian
}
```

#### 2. UI Components

- **Case Status Badge**: Shows "Case Open" or "Case Closed" with icons
- **Close Case Button**: Only visible to authorized users
- **Closure Form**: Textarea for entering closure reason
- **Confirmation**: Two-step process (expand form, then confirm)

## User Experience

### For Current Custodian

1. **Navigate to Evidence Details page**
2. **See "Close Case" button** (red button with lock icon)
3. **Click to expand closure form**
4. **Enter closure reason** (required)
5. **Click "Confirm Close Case"**
6. **Case is marked as closed**

### For Admin

Same as custodian, plus:
- Can close ANY case (not just ones they're custodian of)
- Can reopen closed cases (future feature)

### For Other Users

- **Cannot see** "Close Case" button
- Can view case status badge
- Can see closure details if case is closed

## Permissions Matrix

| User Type | Close Own Custody | Close Any Case | Reopen Case | View Status |
|-----------|-------------------|----------------|-------------|-------------|
| Current Custodian | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Other Users | ❌ No | ❌ No | ❌ No | ✅ Yes |

## API Response Examples

### Successful Closure

```json
POST /api/evidence/EV-2024-001/close
{
  "closureReason": "Investigation complete, evidence analyzed and documented"
}

Response: 200 OK
{
  "success": true,
  "message": "Case closed successfully",
  "evidence": {
    "evidenceId": "EV-2024-001",
    "caseId": "CASE-2024-001",
    "caseStatus": "CLOSED",
    "closedBy": "0x1234567890abcdef...",
    "closedAt": "2024-12-27T15:30:00.000Z",
    "closureReason": "Investigation complete, evidence analyzed and documented"
  }
}
```

### Permission Denied

```json
Response: 403 Forbidden
{
  "success": false,
  "message": "Only the current custodian or admin can close this case",
  "details": {
    "userAddress": "0xuser...",
    "currentCustodian": "0xcustodian...",
    "isAdmin": false,
    "isCustodian": false
  }
}
```

### Already Closed

```json
Response: 400 Bad Request
{
  "success": false,
  "message": "Case is already closed"
}
```

## Testing Guide

### Test 1: Custodian Closes Case

**Setup:**
1. Upload evidence as User A
2. User A becomes current custodian
3. Login as User A

**Steps:**
1. Navigate to evidence details page
2. Verify "Close Case" button is visible
3. Click "Close Case" button
4. Enter closure reason: "Case resolved, suspect apprehended"
5. Click "Confirm Close Case"

**Expected:**
- ✅ Success toast appears
- ✅ Case status badge changes to "Case Closed" (red)
- ✅ Close Case button disappears
- ✅ Database updated with closure details

### Test 2: Admin Closes Any Case

**Setup:**
1. Upload evidence as User A
2. Login as Admin (different user)

**Steps:**
1. Navigate to evidence details page
2. Verify "Close Case" button is visible (admin can close any case)
3. Close the case

**Expected:**
- ✅ Admin can close case even though not custodian
- ✅ closedBy field shows admin's address

### Test 3: Non-Custodian Cannot Close

**Setup:**
1. Upload evidence as User A (custodian)
2. Login as User B (not custodian, not admin)

**Steps:**
1. Navigate to evidence details page

**Expected:**
- ❌ "Close Case" button NOT visible
- ✅ Can view case status
- ✅ If try via API directly → 403 Forbidden

### Test 4: Cannot Close Already Closed Case

**Setup:**
1. Close a case
2. Try to close it again

**Expected:**
- ❌ "Close Case" button not visible
- ✅ Case status shows "Closed"
- ✅ If try via API → 400 Bad Request

## Frontend Code Example

```tsx
// Check permissions
const canCloseCase = () => {
  if (!user || !evidence) return false
  if (evidence.caseStatus === 'CLOSED') return false
  if (isAdmin()) return true
  
  const userAddress = user.address.toLowerCase()
  const custodian = evidence.currentCustodian?.toLowerCase()
  return userAddress === custodian
}

// Close case handler
const handleCloseCase = async () => {
  try {
    const response = await axios.patch(`/api/evidence/${id}/close`, {
      closureReason: closureReason.trim()
    })
    
    if (response.data.success) {
      toast.success('Case closed successfully!')
      loadEvidenceDetails() // Reload to show updated status
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to close case')
  }
}

// Render button
{canCloseCase() && evidence.caseStatus !== 'CLOSED' && (
  <button onClick={() => setShowCloseCase(true)}>
    <Lock /> Close Case
  </button>
)}
```

## Backend Code Example

```javascript
// Close case endpoint
router.patch('/:id/close', authMiddleware, async (req, res) => {
  const { closureReason } = req.body
  const evidence = await Evidence.findOne({ evidenceId: req.params.id })
  
  // Permission check
  const userAddress = req.user.address.toLowerCase()
  const isAdmin = req.user.role === 'ADMIN'
  const isCustodian = evidence.currentCustodian?.toLowerCase() === userAddress
  
  if (!isAdmin && !isCustodian) {
    return res.status(403).json({
      message: 'Only the current custodian or admin can close this case'
    })
  }
  
  // Close the case
  evidence.caseStatus = 'CLOSED'
  evidence.closedBy = req.user.address
  evidence.closedAt = new Date()
  evidence.closureReason = closureReason
  
  await evidence.save()
  res.json({ success: true, evidence })
})
```

## Security Considerations

1. **Authentication Required** - All endpoints require valid JWT token
2. **Role-Based Access** - Permission checks in both frontend and backend
3. **Audit Trail** - Tracks who closed case and when
4. **Validation** - Closure reason is mandatory
5. **Immutability** - Once closed, only admin can reopen

## Future Enhancements

Potential improvements:

- [ ] **Email Notifications** - Notify stakeholders when case is closed
- [ ] **Closure Attachments** - Upload final reports with closure
- [ ] **Bulk Closure** - Close multiple cases at once
- [ ] **Closure Templates** - Pre-defined closure reasons
- [ ] **Case Analytics** - Track average time to close cases
- [ ] **Workflow Automation** - Auto-close after certain conditions
- [ ] **Closure Approvals** - Require supervisor approval before closing

## Troubleshooting

### "Only the current custodian or admin can close this case"

**Cause:** User trying to close is not the custodian or admin

**Solution:**
1. Check current custodian in evidence details
2. Transfer custody to yourself first, OR
3. Ask admin to close the case

### Close button not visible

**Check:**
1. Are you logged in?
2. Is your role ADMIN or are you the current custodian?
3. Is the case already closed?
4. Check console for permission errors

### Case status not updating

**Check:**
1. Backend server is running
2. MongoDB is connected
3. Check browser console for API errors
4. Verify JWT token is valid

## Database Migration

If upgrading from previous version, existing evidence records will have:
- `caseStatus`: defaults to 'OPEN'
- `currentCustodian`: defaults to null (will use uploadedBy)
- Other closure fields: null until case is closed

No migration script needed - fields have defaults.

## Summary

✅ **Backend**: Evidence model updated with case status fields  
✅ **Backend**: Close/reopen endpoints with permission checks  
✅ **Frontend**: Close case UI in Evidence Details  
✅ **Frontend**: Permission checks (custodian or admin)  
✅ **Security**: Role-based access control  
✅ **UX**: Clear visual indicators and validation  
✅ **Audit**: Tracks who closed case, when, and why  

Only the **current custodian** or **admin** can close a case!
