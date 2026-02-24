# Deployment Guide

## Quick Deployment Options

### 1. MongoDB Atlas Setup (Required First)

1. **Create Account & Cluster:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up / Login
   - Create a FREE M0 cluster (512 MB)
   - Choose your cloud provider and region

2. **Create Database User:**
   - Security → Database Access → Add New Database User
   - Username: `assetflow_user`
   - Password: Generate secure password (save it!)
   - Database User Privileges: Read and write to any database

3. **Whitelist IP Addresses:**
   - Security → Network Access → Add IP Address
   - For testing: `0.0.0.0/0` (Allow access from anywhere)
   - For production: Add specific IPs of your servers

4. **Get Connection String:**
   - Data Storage → Clusters → Connect → Connect your application
   - Choose "Node.js" driver
   - Copy connection string
   - Example: `mongodb+srv://assetflow_user:PASSWORD@cluster0.xxxxx.mongodb.net/assetflow?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password
   - Replace `test` with `assetflow` (or your DB name)

---

## Frontend Deployment

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

**Environment Variables in Vercel:**
- Dashboard → Settings → Environment Variables
- Add: `REACT_APP_BACKEND_URL` = `https://your-backend-url.com`

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
cd frontend
yarn build

# Deploy
netlify deploy --prod --dir=build
```

**Environment Variables in Netlify:**
- Site Settings → Build & Deploy → Environment
- Add: `REACT_APP_BACKEND_URL` = `https://your-backend-url.com`

### Option C: Static Hosting (AWS S3, GitHub Pages, etc.)

```bash
cd frontend
yarn build
# Upload contents of build/ folder to your static hosting
```

---

## Backend Deployment

### Option A: Railway.app (Recommended - Free Tier Available)

1. **Install CLI:**
```bash
npm install -g @railway/cli
```

2. **Deploy:**
```bash
cd backend
railway login
railway init
railway up
```

3. **Set Environment Variables:**
```bash
railway variables set MONGODB_URI="your-atlas-connection-string"
railway variables set DB_NAME="assetflow"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set CORS_ORIGINS="https://your-frontend-domain.vercel.app"
```

4. **Get Backend URL:**
```bash
railway domain
# Copy the URL and use it as REACT_APP_BACKEND_URL in frontend
```

### Option B: Render.com (Free Tier Available)

1. **Create Account:** https://render.com
2. **New Web Service:**
   - Connect GitHub repository
   - Root Directory: `backend`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:**
   ```
   MONGODB_URI = your-atlas-connection-string
   DB_NAME = assetflow
   JWT_SECRET = (generate with: openssl rand -base64 32)
   CORS_ORIGINS = https://your-frontend-domain.com
   UPLOAD_DIR = /opt/render/project/uploads
   ```

### Option C: DigitalOcean App Platform

1. **Create App:** https://cloud.digitalocean.com/apps
2. **Connect Repository:** Select your GitHub repo
3. **Configure:**
   - Component: Web Service
   - Source Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn server:app --host 0.0.0.0 --port 8080`

4. **Environment Variables:** Same as above

### Option D: Heroku

1. **Install CLI:**
```bash
npm install -g heroku
```

2. **Deploy:**
```bash
cd backend
heroku login
heroku create your-app-name
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a your-app-name
git push heroku main
```

3. **Set Environment Variables:**
```bash
heroku config:set MONGODB_URI="your-connection-string"
heroku config:set DB_NAME="assetflow"
heroku config:set JWT_SECRET="$(openssl rand -base64 32)"
heroku config:set CORS_ORIGINS="https://your-frontend-domain.com"
```

---

## Full Stack Deployment Checklist

### Pre-Deployment

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with credentials saved
- [ ] IP addresses whitelisted
- [ ] Connection string obtained
- [ ] JWT secret generated: `openssl rand -base64 32`

### Backend Deployment

- [ ] Backend deployed to Railway/Render/etc
- [ ] Environment variables configured:
  - [ ] MONGODB_URI
  - [ ] DB_NAME
  - [ ] JWT_SECRET
  - [ ] CORS_ORIGINS
- [ ] Backend URL obtained (e.g., `https://your-app.railway.app`)
- [ ] Test backend: Visit `https://your-backend-url/docs`

### Frontend Deployment

- [ ] Update `.env` with backend URL
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Environment variable `REACT_APP_BACKEND_URL` set
- [ ] Test frontend: Visit your frontend URL
- [ ] Login with default credentials:
  - Email: `admin@local.internal`
  - Password: `Admin123!`

### Post-Deployment

- [ ] Change default admin password
- [ ] Create additional users if needed
- [ ] Configure SMTP settings (Settings → Integration → SMTP)
- [ ] Test asset creation
- [ ] Test employee creation
- [ ] Test asset transfer
- [ ] Test export functionality
- [ ] Configure Monday.com integration (optional)

---

## Environment Variables Summary

### Backend

| Variable | Required | Example |
|----------|----------|---------|
| MONGODB_URI | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/assetflow` |
| DB_NAME | Yes | `assetflow` |
| JWT_SECRET | Yes | `random-32-char-string` |
| CORS_ORIGINS | Yes | `https://your-frontend.vercel.app` |
| UPLOAD_DIR | No | `/app/uploads` (default) |

### Frontend

| Variable | Required | Example |
|----------|----------|---------|
| REACT_APP_BACKEND_URL | Yes | `https://your-backend.railway.app` |

---

## Testing Deployment

### Backend Health Check

```bash
curl https://your-backend-url/api/health
# Should return: {"status": "ok"}
```

### Full System Test

1. Visit frontend URL
2. Login with default credentials
3. Create test employee
4. Create test asset
5. Assign asset to employee
6. Test export
7. Change password

---

## Troubleshooting

### Backend Error: "Database connection failed"
- Verify MONGODB_URI is correct
- Check MongoDB Atlas IP whitelist
- Test connection: `mongosh "your-connection-string"`

### Frontend Error: "Network Error"
- Verify REACT_APP_BACKEND_URL is correct
- Check CORS_ORIGINS in backend includes your frontend domain
- Check backend is running: visit `/docs` endpoint

### 502 Bad Gateway
- Backend might be starting up (wait 1-2 minutes)
- Check backend logs in your hosting platform
- Verify start command is correct

---

## Cost Estimates

### Free Tier Deployment

- **MongoDB Atlas:** M0 (512 MB) - FREE
- **Railway:** 500 hours/month, 512 MB - FREE
- **Vercel:** Hobby plan - FREE
- **Total:** $0/month

### Production Deployment

- **MongoDB Atlas:** M10 (2 GB) - ~$9/month
- **Railway:** Pro plan - $5/month
- **Vercel:** Pro plan - $20/month
- **Total:** ~$34/month

---

## Security Recommendations

1. **Generate Strong JWT Secret:** `openssl rand -base64 32`
2. **Use HTTPS:** Enable SSL on your hosting platform
3. **Whitelist Specific IPs:** In MongoDB Atlas (production)
4. **Change Default Password:** Immediately after first deployment
5. **Environment Variables:** Never commit to Git
6. **Regular Backups:** Enable MongoDB automated backups
7. **Update Dependencies:** Regularly update packages

---

## Support

If you encounter issues:
1. Check hosting platform logs
2. Verify environment variables
3. Test MongoDB connection separately
4. Check CORS configuration
5. Review backend logs at `/api/health`
