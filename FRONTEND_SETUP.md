# 🎨 ENY AI Frontend - Production Setup Guide

## 🚀 Quick Setup for Production API

Your backend is now deployed at `https://enyapi.josephofili.live`. Follow these steps to connect your frontend:

### **Step 1: Create Environment File**

Create a `.env.local` file in the frontend root directory:

```bash
cd frontend
touch .env.local
```

### **Step 2: Add Environment Variables**

Copy and paste this content into `.env.local`:

```bash
# ENY AI Student Support Portal - Frontend Environment Variables
# Production API Configuration

# API Configuration - Production Backend
REACT_APP_API_URL=https://enyapi.josephofili.live/api/v1
REACT_APP_STREAMING_URL=https://enyapi.josephofili.live/api/v1/streaming

# Application Configuration
REACT_APP_APP_NAME=ENY AI Student Portal
REACT_APP_VERSION=2.0.0

# Environment
NODE_ENV=development

# Feature Flags
REACT_APP_ENABLE_DARK_MODE=false
REACT_APP_ENABLE_ANALYTICS=false
```

### **Step 3: Start Development Server**

```bash
npm start
```

Your frontend will now connect to the production backend at `https://enyapi.josephofili.live`!

## 🌐 Production Deployment

### **For Production Build:**

1. **Create `.env.production` file:**
```bash
# Production Configuration
REACT_APP_API_URL=https://enyapi.josephofili.live/api/v1
REACT_APP_STREAMING_URL=https://enyapi.josephofili.live/api/v1/streaming
REACT_APP_APP_NAME=ENY AI Student Portal
REACT_APP_VERSION=2.0.0
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

2. **Build for production:**
```bash
npm run build
```

3. **Deploy to your preferred platform:**
   - **Netlify**: Drag & drop `build` folder
   - **Vercel**: Connect GitHub repo
   - **Render**: Static site deployment

## 🔧 Verification Steps

### **1. Check API Connection**

Open browser console and verify:
```javascript
// Should show your production API URL
console.log(process.env.REACT_APP_API_URL);
// Output: https://enyapi.josephofili.live/api/v1
```

### **2. Test Health Endpoint**

Visit in browser:
```
https://enyapi.josephofili.live/api/v1/streaming/health
```

Should return:
```json
{
  "status": "healthy",
  "streaming": "available",
  "rag_enabled": true,
  "timestamp": 1234567890.123
}
```

### **3. Test Chat Functionality**

1. **Public Chat**: Should work without login
2. **Student Chat**: Should work after login
3. **Streaming**: Should see word-by-word responses
4. **Enrollment Forms**: Should appear when intent detected

## 🚀 Platform-Specific Deployment

### **Netlify Deployment**

1. **Build the app:**
```bash
npm run build
```

2. **Deploy:**
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop the `build` folder
   - Or connect GitHub repo for auto-deploy

3. **Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add all `REACT_APP_*` variables

### **Vercel Deployment**

1. **Connect repository:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

2. **Environment Variables:**
   - Go to project dashboard
   - Settings → Environment Variables
   - Add production variables

### **Render Static Site**

1. **Create new Static Site in Render**
2. **Build Command:** `npm run build`
3. **Publish Directory:** `build`
4. **Environment Variables:** Add in dashboard

## 🔍 Troubleshooting

### **CORS Issues**
If you get CORS errors, ensure your backend has:
```python
# In backend config
BACKEND_CORS_ORIGINS=https://your-frontend-domain.com
```

### **API Not Connecting**
1. Check browser network tab for 404/500 errors
2. Verify backend is running: `https://enyapi.josephofili.live/api/v1/streaming/health`
3. Check environment variables are set correctly

### **Streaming Not Working**
1. Verify streaming URL is correct
2. Check browser supports EventSource
3. Look for WebSocket/SSE blocking by firewall

### **Environment Variables Not Loading**
1. Ensure variables start with `REACT_APP_`
2. Restart development server after changes
3. Clear browser cache and localStorage

## 📱 Mobile Testing

Test on mobile devices:
1. **Responsive Design**: Should work on all screen sizes
2. **Touch Interactions**: Chat input and buttons
3. **Streaming**: Should work on mobile browsers
4. **Performance**: Should load quickly

## 🎯 Performance Optimization

### **Build Optimization**
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js

# Optimize build
GENERATE_SOURCEMAP=false npm run build
```

### **Caching Strategy**
- Static assets cached by CDN
- API responses cached in memory
- Service worker for offline support (optional)

## 🔐 Security Checklist

- ✅ **HTTPS Only**: All API calls use HTTPS
- ✅ **No Secrets**: No sensitive data in frontend env vars
- ✅ **CORS Configured**: Backend allows your frontend domain
- ✅ **CSP Headers**: Content Security Policy configured
- ✅ **Input Validation**: All user inputs validated

## 🚀 Go Live Checklist

1. ✅ **Backend deployed** and health check passes
2. ✅ **Environment variables** configured correctly
3. ✅ **Frontend built** with production settings
4. ✅ **Domain configured** (if using custom domain)
5. ✅ **HTTPS enabled** on both frontend and backend
6. ✅ **CORS configured** for your frontend domain
7. ✅ **Mobile tested** on various devices
8. ✅ **Performance optimized** and bundle analyzed

---

**Your ENY AI Student Support Portal is now ready for production! 🎉**

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify network requests in developer tools
3. Test backend health endpoint directly
4. Review this setup guide

Your production API is live at: `https://enyapi.josephofili.live` ✨
