# Deploy to Vercel - Complete Guide

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- Email service credentials (Gmail App Password or SendGrid API key)

---

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Prepare Your Project

Make sure your project has these files:
```
zone5shop-email-server/
├── server.js
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

### Step 2: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/zone5shop-email-server.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the settings
5. **Before deploying**, add environment variables:

Click **"Environment Variables"** and add:
```
EMAIL_SERVICE = gmail
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-password
```

6. Click **"Deploy"**
7. Wait 1-2 minutes for deployment to complete

### Step 4: Get Your API URL

After deployment, Vercel will give you a URL like:
```
https://zone5shop-email-server.vercel.app
```

Your API endpoint will be:
```
https://zone5shop-email-server.vercel.app/api/send-order-confirmation
```

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? zone5shop-email-server
# - In which directory is your code located? ./
```

### Step 4: Add Environment Variables

```bash
# Add email credentials
vercel env add EMAIL_SERVICE
# Enter: gmail

vercel env add EMAIL_USER
# Enter: your-email@gmail.com

vercel env add EMAIL_PASSWORD
# Enter: your-app-password
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Update Frontend to Use Vercel URL

Update your `cart.js` file:

```javascript
// Change from:
const API_URL = 'http://localhost:3000';

// To your Vercel URL:
const API_URL = 'https://zone5shop-email-server.vercel.app';
```

Or make it dynamic:
```javascript
const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://zone5shop-email-server.vercel.app'
    : 'http://localhost:3000';
```

---

## Testing Your Deployed API

### Test Health Endpoint

```bash
curl https://zone5shop-email-server.vercel.app/api/health
```

### Test Email Endpoint

```bash
curl -X POST https://zone5shop-email-server.vercel.app/api/send-order-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD12345678",
    "email": "your-test-email@gmail.com",
    "date": "01 Feb, 2026",
    "items": [
      {
        "name": "Test Product",
        "productcode": "TEST001",
        "quantity": 1,
        "price": 1000,
        "image": "https://via.placeholder.com/150"
      }
    ],
    "subtotal": 1000,
    "shipping": 99,
    "total": 1099
  }'
```

---

## Common Issues and Solutions

### Issue: "Module not found"
**Solution**: Make sure all dependencies are in `package.json` and committed to Git.

### Issue: Environment variables not working
**Solution**: 
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables manually
3. Redeploy the project

### Issue: CORS errors
**Solution**: The server already has CORS enabled. If still having issues, update `server.js`:
```javascript
app.use(cors({
    origin: ['https://yourdomain.com', 'http://localhost:3000'],
    credentials: true
}));
```

### Issue: Email not sending
**Solution**:
1. Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
2. Verify EMAIL_USER and EMAIL_PASSWORD are correct
3. For Gmail, ensure you're using App Password, not regular password

### Issue: "Invalid credentials" for Gmail
**Solution**:
1. Enable 2-Step Verification in Google Account
2. Generate new App Password: https://myaccount.google.com/apppasswords
3. Update EMAIL_PASSWORD in Vercel environment variables
4. Redeploy

---

## View Logs

### Via Dashboard
1. Go to Vercel Dashboard
2. Select your project
3. Click on "Deployments"
4. Click on the latest deployment
5. Click "View Function Logs"

### Via CLI
```bash
vercel logs
```

---

## Update Deployment

After making changes to your code:

```bash
# Commit changes
git add .
git commit -m "Update message"
git push

# Vercel will automatically redeploy
```

Or manually:
```bash
vercel --prod
```

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., api.zone5shop.com)
3. Follow DNS configuration instructions
4. Update `API_URL` in your frontend to use custom domain

---

## Environment Variables Reference

Required variables:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

Optional variables:
```
NODE_ENV=production (automatically set by Vercel)
PORT=3000 (not needed for Vercel)
```

---

## Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use App Passwords, not regular passwords
3. ✅ Set environment variables in Vercel Dashboard
4. ✅ Enable CORS only for your domain in production
5. ✅ Monitor logs regularly for suspicious activity

---

## Cost Estimate

**Vercel Free Tier includes:**
- 100GB bandwidth per month
- 6,000 build minutes per month
- Unlimited serverless function invocations
- Automatic HTTPS

This is more than enough for most small to medium businesses.

---

## Monitoring

### Check API Status
```bash
curl https://zone5shop-email-server.vercel.app/api/health
```

### Monitor in Vercel Dashboard
- View request counts
- Check function execution time
- Monitor errors and logs
- Track bandwidth usage

---

## Support

If you encounter issues:
1. Check Vercel logs
2. Review server console output
3. Verify environment variables are set correctly
4. Test email credentials locally first
5. Check Vercel status: https://www.vercel-status.com/

---

## Next Steps

After successful deployment:
1. ✅ Test the API endpoint
2. ✅ Update frontend with production URL
3. ✅ Send test order
4. ✅ Verify email arrives
5. ✅ Monitor logs for first few days
6. ✅ Set up custom domain (optional)
