# DiceBear Avatar Integration Guide

## 🎨 What is DiceBear?

DiceBear is an avatar library that generates unique, consistent avatars based on a seed (like wallet address or username). Each user gets a unique avatar that stays the same every time.

## ✨ Features

- ✅ **Unique avatars** for each user based on their wallet address
- ✅ **Consistent** - Same user always gets the same avatar
- ✅ **Automatic fallback** to initials if avatar fails to load
- ✅ **Optional API key** for higher rate limits
- ✅ **Multiple avatar styles** available

## 🚀 Setup

### Option 1: Public API (No Key Required)
The app works out-of-the-box with the public DiceBear API:
- **Rate Limit**: 100 requests per hour
- **Free**: No registration needed
- **Good for**: Development and small deployments

Just leave `VITE_DICEBEAR_API_KEY` empty in your `.env.local` file.

### Option 2: With API Key (Recommended for Production)
Get higher rate limits with a DiceBear API key:

1. **Get an API Key**:
   - Visit: https://www.dicebear.com/
   - Sign up for an account
   - Choose a plan (Free tier available)
   - Copy your API key

2. **Add to Environment**:
   ```bash
   # In .env.local
   VITE_DICEBEAR_API_KEY=your_api_key_here
   ```

3. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

## 🎨 Available Avatar Styles

You can change the avatar style in `src/components/UserHoverCard.tsx`:

```typescript
const getAvatarUrl = () => {
  const style = 'avataaars'; // Change this line
  // ...
}
```

### Popular Styles:

| Style | Description | Best For |
|-------|-------------|----------|
| `avataaars` | Cartoon avatars (default) | Fun, friendly look |
| `bottts` | Robot avatars | Tech/sci-fi theme |
| `identicon` | Geometric patterns | Professional, abstract |
| `initials` | Letter-based avatars | Simple, clean |
| `lorelei` | Feminine avatars | Diverse representation |
| `micah` | Illustration style | Artistic look |
| `personas` | Diverse people | Realistic representation |
| `thumbs` | Thumbs up/down | Minimalist |

### Preview Styles:
Visit: https://www.dicebear.com/styles/

## 📍 Where Avatars Appear

Currently avatars are shown in:
- ✅ **User Hover Cards** - When hovering over tagged users in comments

### Future Integration Points:
- 🔲 User Management page
- 🔲 Comment author avatars
- 🔲 Evidence custody chain
- 🔲 User profile pages
- 🔲 Login/Register pages

## 🛠️ Customization

### Change Avatar Style
```typescript
// In UserHoverCard.tsx
const style = 'bottts'; // Change to any style above
```

### Add Custom Parameters
```typescript
const getAvatarUrl = () => {
  const apiKey = import.meta.env.VITE_DICEBEAR_API_KEY;
  const style = 'avataaars';
  const seed = userAddress;
  
  // Add custom parameters
  const params = new URLSearchParams({
    seed: seed,
    // Add more customization:
    backgroundColor: '3b82f6', // Blue background
    radius: '10', // Rounded corners
    scale: '90', // 90% size
    // ... more options at dicebear.com/docs
  });
  
  return `https://api.dicebear.com/7.x/${style}/svg?${params}${apiKey ? `&apikey=${apiKey}` : ''}`;
};
```

## 🔧 Troubleshooting

### Avatars Not Loading?
1. **Check Console** for errors
2. **Verify API Key** is correct (if using)
3. **Check Rate Limits** - You may have hit the 100/hour limit
4. **Fallback Works?** - Initials should appear if avatar fails

### Rate Limit Exceeded?
- **Solution 1**: Get an API key for higher limits
- **Solution 2**: Cache avatars in your backend
- **Solution 3**: Use a different style (each style has separate limits)

### Want Different Avatars for Same User?
Change the seed:
```typescript
// Instead of just address:
const seed = `${userAddress}-${userDetails.role}`; // Different per role
const seed = `${userAddress}-v2`; // Version 2 avatars
```

## 📊 Rate Limits

| Plan | Rate Limit | Price |
|------|------------|-------|
| Public API | 100/hour | Free |
| Free Tier | 5,000/month | Free |
| Starter | 50,000/month | $5/month |
| Pro | 500,000/month | $25/month |

Source: https://www.dicebear.com/pricing

## 🎯 Best Practices

1. ✅ **Use wallet address as seed** - Ensures uniqueness
2. ✅ **Keep fallback** - Initials work if API is down
3. ✅ **Cache in production** - Store avatars on your server
4. ✅ **Get API key** - For production deployments
5. ✅ **Choose appropriate style** - Match your app's theme

## 🔗 Resources

- **DiceBear Website**: https://www.dicebear.com/
- **API Documentation**: https://www.dicebear.com/docs/api
- **Style Preview**: https://www.dicebear.com/styles/
- **Pricing**: https://www.dicebear.com/pricing
- **GitHub**: https://github.com/dicebear/dicebear

## 🎉 Result

Users now get beautiful, unique, and consistent avatars throughout your application!

![User Hover Card with Avatar](https://via.placeholder.com/400x200?text=User+Hover+Card+Preview)

Each user's avatar is generated from their wallet address, ensuring:
- Uniqueness per user
- Consistency across sessions
- Professional appearance
- No storage required
