# 🧪 Test Comment Feature - Step by Step

## 🎯 Complete Testing Guide

Follow these steps to verify the comment feature is working correctly.

---

## 📋 Prerequisites

- [ ] Backend server running on port 5000
- [ ] Frontend running on dev server
- [ ] MongoDB connected
- [ ] At least one evidence exists in system
- [ ] You have user credentials to login

---

## 🚀 Test Procedure

### Phase 1: Setup

#### 1. Restart Frontend
```bash
# Stop frontend (Ctrl+C if running)
npm run dev
```

#### 2. Clear Browser Cache
- Press `F5` (or Ctrl+Shift+R for hard refresh)
- Or: DevTools (F12) → Application → Clear storage

#### 3. Navigate to Application
- Open `http://localhost:5173` (or your dev server URL)

---

### Phase 2: Authentication

#### 4. Login
1. Click **"Login"** button
2. Enter your credentials
3. Should see: ✅ "Login successful!" toast
4. Top-right should show your username/address

**If login fails:**
- Check if backend is running
- Verify MongoDB is connected
- Check credentials are correct

---

### Phase 3: Navigate to Evidence

#### 5. Go to Evidence List
1. Click **"Evidence"** in navigation
2. Or navigate to `/evidence/list`
3. Should see list of evidence items

#### 6. Open Evidence Details
1. Click on any evidence item
2. Or navigate to `/evidence/{evidenceId}`
3. Wait for page to load

---

### Phase 4: Test Reading Comments

#### 7. Scroll to Discussion Section
1. Scroll down to bottom of page
2. Should see **"Discussion"** section
3. Should see statistics bar (comments count, participants, tags)

#### 8. Verify Comment Display
**If there are existing comments:**
- [ ] Comments display correctly
- [ ] Author names show
- [ ] Timestamps show (e.g., "2h ago")
- [ ] Tagged evidence shows as blue badges
- [ ] Tagged users show as purple badges

**If no comments:**
- [ ] Should see "No comments yet" message
- [ ] Should see message to be first to comment

---

### Phase 5: Test Posting Comments

#### 9. Create Simple Comment
1. Type in the comment box: "Test comment"
2. Click **"Post Comment"**
3. Should see: ✅ "Comment posted successfully" (or similar)
4. Comment should appear in list immediately

**Verify:**
- [ ] Comment appears
- [ ] Shows your name
- [ ] Shows "just now" timestamp
- [ ] Shows correct content

#### 10. Create Comment with Evidence Tag
1. Type: "This relates to another evidence"
2. Click **"Tag Related Evidence"**
3. Type in search box (at least 2 characters)
4. Select an evidence from dropdown
5. Should see blue badge with evidence name
6. Click **"Post Comment"**
7. Verify comment posts with evidence tag

**Verify:**
- [ ] Evidence tag shows as blue badge
- [ ] Badge shows evidence name/ID
- [ ] Badge is clickable (navigates to evidence)

#### 11. Create Comment with User Tag
1. Type: "Tagging a colleague"
2. Click **"Tag Users"**
3. Type in search box (at least 2 characters)
4. Select a user from dropdown
5. Should see purple badge with username
6. Click **"Post Comment"**
7. Verify comment posts with user tag

**Verify:**
- [ ] User tag shows as purple badge
- [ ] Badge shows user name
- [ ] Badge displays correctly

---

### Phase 6: Test Comment Actions

#### 12. Reply to Comment
1. Find any comment (yours or others)
2. Click **"Reply"** button
3. Should scroll to comment form
4. Should see "Replying to a comment..." message
5. Type reply: "This is a reply"
6. Click **"Post Comment"**
7. Reply should appear nested under parent comment

**Verify:**
- [ ] Reply appears indented
- [ ] Shows reply icon
- [ ] Can collapse/expand replies

#### 13. Edit Your Comment
1. Find your own comment
2. Click **"Edit"** button (pencil icon)
3. Comment form should appear inline
4. Change text: "Edited comment"
5. Click **"Save"**
6. Should see "(edited)" indicator

**Verify:**
- [ ] Edit button only shows on your comments
- [ ] Text updates correctly
- [ ] "Edited" indicator shows
- [ ] Edit timestamp updates

#### 14. Delete Your Comment
1. Find your own comment
2. Click **"Delete"** button (trash icon)
3. Confirm deletion
4. Comment should disappear

**Verify:**
- [ ] Delete button only shows on your comments
- [ ] Confirmation dialog appears
- [ ] Comment removed from view
- [ ] Comment count updates

---

### Phase 7: Test Search/Tagging

#### 15. Test Evidence Search
1. Click **"Tag Related Evidence"**
2. Type "EV" or part of evidence ID
3. Wait for dropdown
4. Should see matching evidence items
5. Click to select
6. Badge should appear

**Verify:**
- [ ] Search works (shows results)
- [ ] Results are relevant
- [ ] Can select multiple evidences
- [ ] Can remove selected tags (X button)
- [ ] Current evidence is filtered out

#### 16. Test User Search
1. Click **"Tag Users"**
2. Type part of username or address
3. Wait for dropdown
4. Should see matching users
5. Click to select
6. Badge should appear

**Verify:**
- [ ] Search works (shows results)
- [ ] Shows user name and role
- [ ] Can select multiple users
- [ ] Can remove selected tags (X button)
- [ ] Shows user avatar/initial

---

### Phase 8: Test Statistics

#### 17. Verify Statistics Update
1. Note current statistics (top of discussion)
2. Post a new comment
3. Statistics should update:
   - Total comments increases
   - Your name in participants (if first comment)
   - Tags count increases (if you tagged)

**Verify:**
- [ ] Total comments is accurate
- [ ] Unique participants is accurate
- [ ] Comments with tags is accurate

---

### Phase 9: Test Edge Cases

#### 18. Test Empty Comment
1. Try to post empty comment
2. Should NOT allow posting
3. Button should be disabled or show error

#### 19. Test Long Comment
1. Type a very long comment (near 5000 char limit)
2. Should see character counter
3. Should post successfully
4. Should display correctly

#### 20. Test Without Login
1. Logout (if logged in)
2. Navigate to evidence details
3. Should still see comments (read-only)
4. Should NOT see comment form
5. Should see "Please log in" message

---

### Phase 10: Test UI/UX

#### 21. Test Dark Mode
1. Toggle dark mode
2. Check comment section appearance
3. Colors should adapt
4. Text should be readable
5. Badges should be visible

#### 22. Test Responsive Design
1. Resize browser window (mobile size)
2. Comment section should adapt
3. Should be usable on small screens

#### 23. Test Loading States
1. Refresh page
2. Should see loading spinner
3. Comments should load smoothly

---

## ✅ Success Criteria

All these should work:

### Reading ✅
- [x] View comments list
- [x] See comment details (author, time, content)
- [x] See tagged items
- [x] See statistics
- [x] View threaded replies

### Writing ✅
- [x] Post simple comment
- [x] Post with evidence tags
- [x] Post with user tags
- [x] Reply to comments
- [x] Edit own comments
- [x] Delete own comments

### Searching ✅
- [x] Search evidence for tagging
- [x] Search users for tagging
- [x] Select from results
- [x] Remove selected tags

### UI/UX ✅
- [x] Statistics update
- [x] Loading states show
- [x] Error messages display
- [x] Dark mode works
- [x] Responsive design

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch comments"
**Solution:**
- Check backend is running: `netstat -ano | findstr "5000"`
- Check MongoDB connection in backend logs
- Restart backend server

### Issue 2: Can't post comments
**Solution:**
- Verify you're logged in (see username in app)
- Check browser console for errors (F12)
- Clear cache and login again

### Issue 3: Search not showing results
**Solution:**
- Type at least 2 characters
- Wait a moment for results
- Check if items exist in database
- Verify backend routes are working

### Issue 4: Tags not displaying
**Solution:**
- Check if evidence/users exist
- Verify data was saved correctly
- Refresh page

---

## 📊 Test Results Template

Use this to track your testing:

```
Date: _________
Tester: _________

Phase 1 - Setup: ☐ Pass ☐ Fail
Phase 2 - Authentication: ☐ Pass ☐ Fail
Phase 3 - Navigation: ☐ Pass ☐ Fail
Phase 4 - Reading Comments: ☐ Pass ☐ Fail
Phase 5 - Posting Comments: ☐ Pass ☐ Fail
Phase 6 - Comment Actions: ☐ Pass ☐ Fail
Phase 7 - Search/Tagging: ☐ Pass ☐ Fail
Phase 8 - Statistics: ☐ Pass ☐ Fail
Phase 9 - Edge Cases: ☐ Pass ☐ Fail
Phase 10 - UI/UX: ☐ Pass ☐ Fail

Overall: ☐ Pass ☐ Fail

Notes:
_________________________________
_________________________________
```

---

**Ready to test? Follow each step carefully and check off as you go!** ✅
