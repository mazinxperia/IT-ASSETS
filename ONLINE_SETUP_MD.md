# 🌐 AssetFlow -- Online Deployment Guide

This guide explains how to deploy AssetFlow to production using:

-   Frontend: Vercel (Recommended)
-   Backend: Render (Recommended)
-   Database: MongoDB Atlas

------------------------------------------------------------------------

# 🗄️ Step 1 -- MongoDB Atlas (Required First)

1.  Create account at: https://www.mongodb.com/cloud/atlas

2.  Create a Free M0 Cluster.

3.  Create Database User:

    -   Save username and password.

4.  Network Access:

    -   For testing: 0.0.0.0/0
    -   For production: Add backend server IP only.

5.  Get connection string:

Example:
mongodb+srv://username:password@cluster.mongodb.net/assetflow?retryWrites=true&w=majority

Replace password before using.

------------------------------------------------------------------------

# 🖥️ Backend Deployment -- Render

1.  Go to: https://render.com

2.  Create New Web Service

    -   Connect GitHub repository
    -   Root Directory: backend
    -   Environment: Python 3
    -   Build Command: pip install -r requirements.txt
    -   Start Command: uvicorn server:app --host 0.0.0.0 --port \$PORT

3.  Add Environment Variables:

MONGODB_URI=your_mongodb_connection_string DB_NAME=assetflow
JWT_SECRET=generate_random_secret
CORS_ORIGINS=https://your-frontend-domain.vercel.app
UPLOAD_DIR=/opt/render/project/uploads

4.  Deploy and copy backend URL.

Test backend: https://your-backend-url.onrender.com/docs

------------------------------------------------------------------------

# 🎨 Frontend Deployment -- Vercel

1.  Go to: https://vercel.com

2.  Import GitHub repository

    -   Root Directory: frontend

3.  Set Environment Variable:

REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com

4.  Deploy.

Your frontend will be available at: https://your-app.vercel.app

------------------------------------------------------------------------

# 🔐 First Login After Deployment

Open frontend URL.

Default credentials:

Email: admin@local.internal Password: Admin123!

Change password immediately.

------------------------------------------------------------------------

# 🔁 Deployment Flow Overview

Browser (Vercel Frontend) ↓ Backend API (Render) ↓ MongoDB Atlas (Cloud
Database)

------------------------------------------------------------------------

# 📋 Deployment Checklist

Backend: - MONGODB_URI set - DB_NAME set - JWT_SECRET set - CORS_ORIGINS
matches frontend domain

Frontend: - REACT_APP_BACKEND_URL set correctly

Database: - Atlas cluster active - Database user created - Network
access configured

------------------------------------------------------------------------

# 🛡️ Production Security Recommendations

-   Use strong JWT_SECRET (openssl rand -base64 32)
-   Restrict MongoDB IP access to backend only
-   Do not commit .env files
-   Enable HTTPS (automatic in Vercel/Render)
-   Change default admin password immediately
-   Configure SMTP for email exports

------------------------------------------------------------------------

Deployment complete.
