# 🚀 Evidence Chat Feature - Quick Start Guide

## 📌 What You Need to Know

The evidence chat feature allows users to:
- 💬 Discuss and comment on specific evidence
- 👥 Tag other users to involve them in discussions
- 🔗 Reference and link related evidence items
- 🧵 Create threaded conversations with replies

---

## 🏁 Getting Started

### 1. Start the Backend Server

```bash
cd backend
npm install  # If first time
node server.js
```

The server should show:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### 2. Start the Frontend

```bash
npm install  # If first time
npm run dev
```

### 3. Access the Feature

1. **Login** to the system with your credentials
2. Navigate to **Evidence List** page
3. Click on any **evidence item** to view details
4. Scroll down to see the **"Discussion"** section

---

## 💬 How to Use

### Creating a Comment

1. **Type your message** in the text area (max 5000 characters)
2. Optionally **tag related evidence**:
   - Click "Tag Related Evidence"
   - Search by evidence ID, filename, or case number
   - Select evidence from dropdown
3. Optionally **tag users**:
   - Click "Tag Users"
   - Search by name or address
   - Select users from dropdown
4. Click **"Post Comment"**

### Replying to a Comment

1. Find the comment you want to reply to
2. Click the **"Reply"** button
3. Type your reply
4. Click **"Post Comment"**

### Editing Your Comment

1. Find your comment (you can only edit your own)
2. Click the **"Edit"** button (pencil icon)
3. Modify the message and tags
4. Click **"Save"**

### Deleting Your Comment

1. Find your comment (you can only delete your own)
2. Click the **"Delete"** button (trash icon)
3. Confirm deletion

---

## 🎯 Use Cases

### Case 1: Forensic Analysis Discussion
```
Analyst 1: "The CCTV footage shows suspicious activity at 14:30"
[Tags: CCTV_EV001, MOBILE_EV005]
[Mentions: @investigator_john]

Investigator John (reply): "Cross-referencing with mobile data confirms this timeline"
```

### Case 2: Evidence Cross-Reference
```
Officer: "This document relates to the network logs from the same date"
[Tags: NETWORK_LOG_EV010, DOCUMENT_EV008]
```

### Case 3: Team Collaboration
```
Lab Tech: "DNA analysis complete. Results match suspect profile."
[Mentions: @lead_investigator, @prosecutor]
```

---

## 📊 Comment Statistics

At the top of the discussion section, you'll see:
- 💬 **Total comments** - Number of comments on this evidence
- 👥 **Participants** - Number of unique users who commented
- 🏷️ **Tagged** - Number of comments with evidence tags

---

## 🔍 Finding Comments

### View Comments on Specific Evidence
- Go to evidence details page
- Scroll to "Discussion" section

### View Your Comments (Future Feature)
- API endpoint available: `/api/comments/user/:userAddress`
- Can be integrated into user profile page

### View Where You're Tagged (Future Feature)
- API endpoint available: `/api/comments/tagged/:userAddress`
- Can be integrated into notifications

### View Comments Referencing Evidence
- API endpoint available: `/api/comments/tagged-evidence/:evidenceId`
- Shows all comments that reference this evidence

---

## 🎨 UI Features

### Visual Indicators
- **Blue badges** 🔗 = Tagged evidence (clickable)
- **Purple badges** 👤 = Tagged users
- **Edit indicator** = Shows if comment was edited
- **Relative timestamps** = "2h ago", "1d ago", etc.

### Dark Mode Support
- All components support dark/light theme
- Automatically switches based on system theme

### Responsive Design
- Works on desktop, tablet, and mobile
- Optimized layout for all screen sizes

---

## ⚙️ API Reference (For Developers)

### Create Comment
```typescript
POST /api/comments
Content-Type: application/json
Authorization: Bearer <token>

{
  "evidenceId": "EV001",
  "message": "This evidence shows...",
  "taggedEvidences": [
    { "evidenceId": "EV002" }
  ],
  "taggedUsers": [
    { "address": "0x123..." }
  ]
}
```

### Get Comments for Evidence
```typescript
GET /api/comments/evidence/EV001?includeReplies=true
```

### Update Comment
```typescript
PUT /api/comments/:commentId
Authorization: Bearer <token>

{
  "message": "Updated message",
  "taggedEvidences": [...],
  "taggedUsers": [...]
}
```

---

## 🐛 Troubleshooting

### Comments Not Showing
- ✅ Check if backend server is running
- ✅ Check MongoDB connection
- ✅ Open browser console for errors

### Can't Post Comments
- ✅ Ensure you're logged in
- ✅ Check if message is not empty
- ✅ Verify authentication token is valid

### Search Not Working
- ✅ Type at least 2 characters
- ✅ Wait for search results to load
- ✅ Check network connectivity

### Tagged Evidence/Users Not Showing
- ✅ Ensure evidence/user exists in database
- ✅ Check if you have proper permissions
- ✅ Verify the IDs are correct

---

## 🔐 Permissions

### Who Can Comment?
- ✅ All authenticated users can post comments

### Who Can Edit Comments?
- ✅ Only the author of the comment

### Who Can Delete Comments?
- ✅ Only the author of the comment

### Who Can View Comments?
- ✅ All users (no authentication required for reading)

---

## 💡 Best Practices

### Writing Effective Comments
1. **Be Clear**: State your findings clearly
2. **Tag Relevant Items**: Link related evidence
3. **Mention Team Members**: Tag users who need to see this
4. **Use Threading**: Reply to specific comments to maintain context

### Evidence Tagging
- Tag evidence that directly relates to your comment
- Don't over-tag - be selective
- Use tags to build evidence relationships

### User Tagging
- Tag users who need to take action
- Tag users whose expertise is needed
- Don't spam-tag everyone

---

## 📝 Example Workflow

### Investigation Scenario

**Step 1**: Officer uploads CCTV evidence
```
Evidence ID: CCTV_001
Case: CASE-2025-001
```

**Step 2**: Forensic analyst comments
```
"Footage shows vehicle entering at 14:30. License plate partially visible."
Tags: [PHOTO_002 - License plate closeup]
Mentions: [@traffic_analyst]
```

**Step 3**: Traffic analyst replies
```
"License plate matches vehicle registered to suspect. Cross-checking with toll data."
Tags: [TOLL_DATA_003]
```

**Step 4**: Lead investigator comments
```
"Excellent work team. This establishes timeline. Preparing warrant."
Mentions: [@prosecutor, @forensic_analyst]
```

**Result**: 
- Clear evidence trail established
- All related evidence linked
- Team collaboration documented
- Timeline verified and approved

---

## 🎓 Training Tips

### For New Users
1. Start by viewing existing comments
2. Practice replying to comments first
3. Try tagging evidence you're familiar with
4. Get comfortable with search functionality

### For Administrators
1. Review comment patterns for training
2. Monitor for policy compliance
3. Use comments to track investigation quality
4. Export comment data for reports (future feature)

---

## 📞 Need Help?

- 📖 **Documentation**: See `EVIDENCE_CHAT_FEATURE.md` for technical details
- 🐛 **Report Issues**: Check browser console and server logs
- 💬 **Questions**: Review API endpoints in the documentation

---

## ✅ Checklist Before Using

- [ ] Backend server running and connected to MongoDB
- [ ] Frontend application running
- [ ] User is logged in with valid credentials
- [ ] At least one evidence exists in the system
- [ ] Browser console shows no errors

---

**Ready to collaborate? Start commenting on evidence now! 🚀**
