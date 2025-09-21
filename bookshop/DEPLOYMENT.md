# 🚀 Deploying Bookshop Manager to Vercel

Complete step-by-step guide to deploy your bookshop management system to Vercel.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- PostgreSQL database (Neon recommended)

## 🗂️ Step 1: Prepare Your Repository

### 1.1 Create .env.example file

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# Authentication
ADMIN_USERNAME="your_admin_username"
ADMIN_PASSWORD="your_secure_password"

# Next.js (Vercel will auto-generate NEXTAUTH_URL)
NEXTAUTH_SECRET="your_32_character_secret_key_here"
NEXTAUTH_URL="https://your-app.vercel.app"
```

### 1.2 Update .gitignore (if needed)

Ensure these files are ignored:

```
# Environment variables
.env
.env.local
.env.production

# Database
*.db
*.sqlite

# Vercel
.vercel
```

### 1.3 Verify package.json has build scripts

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

## 🗃️ Step 2: Set Up Database (Neon PostgreSQL)

### 2.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Click "Create Project"

### 2.2 Configure Database

1. **Project Name**: `bookshop-manager`
2. **Database Name**: `bookshop`
3. **Region**: Choose closest to your location
4. Click "Create Project"

### 2.3 Get Connection String

1. In Neon dashboard, go to "Connection Details"
2. Select "Pooled Connection"
3. Copy the connection string
4. It should look like: `postgresql://username:password@hostname/database?sslmode=require`

## 📤 Step 3: Push to GitHub

### 3.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Bookshop Manager"
```

### 3.2 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "+" → "New repository"
3. **Repository name**: `bookshop-manager`
4. **Visibility**: Public or Private (your choice)
5. **Don't** initialize with README (you already have one)
6. Click "Create repository"

### 3.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/bookshop-manager.git
git branch -M main
git push -u origin main
```

## 🚀 Step 4: Deploy to Vercel

### 4.1 Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Sign in with GitHub
3. Click "New Project"
4. Import your `bookshop-manager` repository

### 4.2 Configure Project Settings

1. **Project Name**: `bookshop-manager` (or your preferred name)
2. **Framework Preset**: Next.js (should auto-detect)
3. **Root Directory**: `./` (default)
4. **Build Command**: `npm run build` (default)
5. **Output Directory**: `.next` (default)
6. **Install Command**: `npm install` (default)

### 4.3 Add Environment Variables

In Vercel project settings, add these environment variables:

| Variable          | Value                         | Notes                                     |
| ----------------- | ----------------------------- | ----------------------------------------- |
| `DATABASE_URL`    | Your Neon connection string   | From Step 2.3                             |
| `ADMIN_USERNAME`  | `smartbookshop`               | Or your preferred admin username          |
| `ADMIN_PASSWORD`  | `your_secure_password`        | Use a strong password                     |
| `NEXTAUTH_SECRET` | Generate 32-char secret       | Use: `openssl rand -base64 32`            |
| `NEXTAUTH_URL`    | `https://your-app.vercel.app` | Will be auto-generated after first deploy |

### 4.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Vercel will provide your app URL

## 🗄️ Step 5: Initialize Database Schema

### 5.1 Run Database Migration

After successful deployment, you need to set up the database schema:

**Option A: Use Vercel CLI** (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run database push
vercel env pull .env.local
npx prisma db push
```

**Option B: Local setup then migrate**

```bash
# Pull environment variables
npx vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

## 📊 Step 6: Import Initial Data (Optional)

If you have existing book data:

### 6.1 Prepare Data

- Ensure your book.sql or CSV files are ready
- You can use Prisma Studio to manually add initial data

### 6.2 Use Prisma Studio (Recommended)

```bash
# Open Prisma Studio locally connected to production DB
npx prisma studio
```

## ✅ Step 7: Verify Deployment

### 7.1 Test Basic Functionality

1. Visit your Vercel app URL
2. Try to log in with admin credentials
3. Test creating a book, author, and customer
4. Test the search functionality
5. Create a test order

### 7.2 Check Performance

- Verify all pages load quickly
- Test API endpoints work correctly
- Check database connections are stable

## 🔧 Step 8: Configure Custom Domain (Optional)

### 8.1 Add Custom Domain

1. In Vercel project settings → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable to your custom domain

## 🔄 Step 9: Automatic Deployments

Now your project is set up for automatic deployments:

- **Push to main branch** → Automatic production deployment
- **Push to other branches** → Preview deployments
- **Pull requests** → Preview deployments

## 🛠️ Troubleshooting

### Common Issues:

**Build Fails**:

- Check environment variables are set correctly
- Verify all dependencies are in package.json
- Check build logs for specific errors

**Database Connection Issues**:

- Verify DATABASE_URL is correct
- Check Neon database is running
- Ensure connection string includes `sslmode=require`

**Authentication Not Working**:

- Verify NEXTAUTH_SECRET is set (32+ characters)
- Check NEXTAUTH_URL matches your domain
- Verify admin credentials are correct

**Prisma Issues**:

```bash
# Regenerate Prisma client
npx prisma generate

# Reset and push schema
npx prisma db push --force-reset
```

## 📈 Post-Deployment

### Performance Monitoring

- Monitor Vercel analytics
- Check database performance in Neon
- Set up error tracking (optional)

### Security

- Regularly update dependencies
- Monitor for security vulnerabilities
- Use strong admin passwords
- Consider adding rate limiting

## 🎉 Congratulations!

Your Bookshop Manager is now live on Vercel!

**Next Steps:**

1. Share the URL with users
2. Add initial book inventory
3. Train staff on the system
4. Monitor performance and user feedback

**Your app is available at**: `https://your-project-name.vercel.app`
