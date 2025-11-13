# Fixing Vercel Backend 500 Error

## Problem
The Vercel deployed backend is returning 500 Internal Server Error when accessing `/api/cart`.

## Root Cause Analysis
The error is likely due to one of these issues:

1. **Missing Environment Variables on Vercel**
   - The `MONGODB_URI` or `MONGO_URI` is not set in Vercel environment variables
   - The backend cannot connect to MongoDB without these credentials

2. **CORS Configuration Issue**
   - The Vercel deployment might have different CORS requirements
   - Headers might not be properly set for OPTIONS preflight requests

3. **Missing User ID Header**
   - The `x-user-id` header might not be sent or received properly

## Solution Steps

### 1. Set Environment Variables on Vercel

Go to your Vercel dashboard and add these environment variables:

```bash
MONGODB_URI=mongodb+srv://vibe-commerce-cart:Girendra%400311@cluster0.tpqmpon.mongodb.net/vibe-commerce?retryWrites=true&w=majority
NODE_ENV=production
```

**Steps:**
1. Go to https://vercel.com/dashboard
2. Select your project: `vibe-commerce-cart`
3. Go to Settings → Environment Variables
4. Add `MONGODB_URI` with the value above
5. Add `NODE_ENV` with value `production`
6. Redeploy the project

### 2. Check Vercel Logs

To see the actual error:

1. Go to Vercel Dashboard → Your Project
2. Click on "Deployments"
3. Click on the latest deployment
4. Click "View Function Logs"
5. Look for errors in the `/api/cart` function

### 3. Verify CORS Headers

The backend has been updated with:
- Better error handling
- User ID validation
- Enhanced logging

### 4. Test the API Directly

Test the Vercel backend directly:

```bash
# Test GET /api/cart
curl -X GET https://vibe-commerce-cart-weld.vercel.app/api/cart \
  -H "x-user-id: guest@example.com" \
  -H "Content-Type: application/json"

# Test GET /api/products
curl https://vibe-commerce-cart-weld.vercel.app/api/products
```

### 5. Common Issues & Fixes

#### Issue: "User ID is required"
**Fix:** Make sure the frontend is sending the `x-user-id` header:
```javascript
api.defaults.headers.common['x-user-id'] = DEFAULT_USER_ID;
```

#### Issue: "MongoDB connection failed"
**Fix:** Verify the MongoDB URI is correct and the database cluster is accessible from Vercel's IP addresses. You may need to:
- Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas
- Check that the database user has proper permissions

#### Issue: "CORS error"
**Fix:** The backend now sets proper CORS headers. If still failing, check:
```javascript
// In lib/utils.js
res.setHeader('Access-Control-Allow-Origin', '*');
```

## Current Workaround

The frontend is currently configured to use the **local backend**:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

To switch back to Vercel backend after fixing:

```env
VITE_API_BASE_URL=https://vibe-commerce-cart-weld.vercel.app/api
```

## Files Modified

1. **backend/api/cart.js** - Added user ID validation
2. **backend/lib/utils.js** - Enhanced error logging
3. **frontend/.env** - Changed to use local backend temporarily

## Next Steps

1. ✅ Local backend is running on `http://localhost:5000`
2. ✅ Frontend is now using local backend
3. ⏳ Fix Vercel environment variables
4. ⏳ Redeploy backend to Vercel
5. ⏳ Switch frontend back to Vercel backend

## Testing

After deploying the fixes:

1. Open browser console
2. Navigate to Cart page
3. Check Network tab for `/api/cart` request
4. Should return 200 OK with cart data
5. If 500 error persists, check Vercel function logs
