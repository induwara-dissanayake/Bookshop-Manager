# 🚀 Deployment Guide: Vercel + Neon Database

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (free tier available)
- ✅ Neon database account (free tier available)

---

## 📋 Step-by-Step Deployment Process

### 1. **Prepare Your Neon Database**

#### A. Create Neon Project

1. Go to [https://neon.tech/](https://neon.tech/)
2. Sign up/Login with GitHub
3. Click **"Create Project"**
4. Choose:
   - **Region**: Singapore (ap-southeast-1) - closest to you
   - **Database Name**: `bookshop_db`
   - **PostgreSQL Version**: Latest (16.x)

#### B. Get Database Connection String

1. In your Neon dashboard, go to **"Connection Details"**
2. Copy the **"Pooled Connection"** string (recommended for Vercel)
3. It should look like:
   ```
   postgresql://username:password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/dbname?sslmode=require
   ```

#### C. Initialize Database Schema

1. In your Neon dashboard, click **"SQL Editor"**
2. Run the SQL script from your `bookshop_db.sql` file
3. Alternatively, use Prisma:
   ```bash
   npx prisma db push
   ```

---

### 2. **Prepare GitHub Repository**

#### A. Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `bookshop-manager`
3. Make it **Public** (required for Vercel free tier)
4. Don't initialize with README (you already have one)

#### B. Push Your Code

```bash
# Navigate to your project
cd "C:\Users\Induwara\Desktop\Git Projects\Bookshop-Manager\bookshop"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Complete bookshop management system"

# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/bookshop-manager.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

### 3. **Deploy to Vercel**

#### A. Connect GitHub to Vercel

1. Go to [https://vercel.com/](https://vercel.com/)
2. Sign up/Login with **GitHub**
3. Click **"New Project"**
4. Import your `bookshop-manager` repository
5. Click **"Deploy"**

#### B. Configure Environment Variables

In Vercel dashboard → Your Project → Settings → Environment Variables:

**Add these variables:**

```
DATABASE_URL=postgresql://your_neon_connection_string_here
ADMIN_USERNAME=smartbookshop
ADMIN_PASSWORD=your_secure_password_here
NEXTAUTH_SECRET=your_32_character_secret_here
NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**

```bash
# Run this command to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### C. Redeploy After Setting Environment Variables

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete

---

### 4. **Verify Deployment**

#### A. Test Your Application

1. Visit your Vercel URL (e.g., `https://bookshop-manager.vercel.app`)
2. Try logging in with your admin credentials
3. Test creating customers, books, authors, and orders
4. Verify database connections work

#### B. Check Database Connection

1. In Neon dashboard, go to **"Monitoring"**
2. You should see connection activity from Vercel

---

### 5. **Post-Deployment Setup**

#### A. Custom Domain (Optional)

1. In Vercel → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

#### B. Environment Security

1. **Change default passwords** in production
2. Use **strong NEXTAUTH_SECRET**
3. Consider **IP restrictions** in Neon for enhanced security

---

## 🔧 Troubleshooting

### Common Issues:

**Build Errors:**

- Ensure all environment variables are set in Vercel
- Check build logs in Vercel dashboard

**Database Connection Issues:**

- Verify DATABASE_URL format includes `?sslmode=require`
- Check Neon database is active (not sleeping)

**Authentication Issues:**

- Ensure NEXTAUTH_SECRET is set and matches format
- Check ADMIN_USERNAME and ADMIN_PASSWORD are correct

---

## 📱 Production URLs

After deployment, you'll have:

- **Application**: `https://your-project-name.vercel.app`
- **Database**: Managed by Neon
- **Admin Panel**: `https://your-project-name.vercel.app/login`

---

## 🎉 You're Done!

Your bookshop management system is now live and ready for use!

**Next Steps:**

1. Share the URL with users
2. Monitor usage in Vercel and Neon dashboards
3. Set up backups in Neon (Pro feature)
4. Consider upgrading plans as usage grows
