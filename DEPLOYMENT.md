# Auto Dealer Platform - Deployment Guide

This guide covers deploying the Auto Dealer Platform to production using:

- **Hosting:** Vercel
- **Database:** Railway PostgreSQL
- **File Storage:** Cloudflare R2
- **Email:** Resend (optional)

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier works)
- Railway account with PostgreSQL database
- Cloudflare account with R2 enabled

---

## 1. Railway PostgreSQL Setup

### Create Database

1. Go to [Railway](https://railway.app) and create a new project
2. Click **+ New** → **Database** → **PostgreSQL**
3. Wait for the database to provision

### Get Connection String

1. Click on the PostgreSQL service
2. Go to **Variables** tab
3. Copy the `DATABASE_URL` value
4. Save this for Vercel configuration

### Important Notes

- Railway provides automatic backups
- Connection pooling is handled by the app
- SSL is enabled by default

---

## 2. Cloudflare R2 Setup

### Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name it (e.g., `auto-dealer-uploads`)
5. Choose a region close to your users

### Create API Token

1. In R2 section, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions:
   - **Object Read & Write** for your bucket
4. Copy and save:
   - Access Key ID
   - Secret Access Key

### Configure Public Access

Option A: R2.dev Subdomain (Quick)

1. Go to bucket settings
2. Enable **Public Access**
3. Note the `*.r2.dev` URL

Option B: Custom Domain (Recommended)

1. Add a CNAME record in your DNS
2. Configure the domain in R2 bucket settings

### Required R2 Environment Variables

```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=auto-dealer-uploads
R2_PUBLIC_DOMAIN=your-bucket.r2.dev
```

---

## 3. Vercel Deployment

### Connect Repository

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Select the `auto-dashboard` repository

### Configure Environment Variables

In Vercel project settings → **Environment Variables**, add:

| Variable                     | Required | Description                                              |
| ---------------------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`               | Yes      | Railway PostgreSQL connection string                     |
| `NEXTAUTH_SECRET`            | Yes      | Random secret (`openssl rand -base64 32`)                |
| `NEXTAUTH_URL`               | Yes      | Your Vercel domain (e.g., `https://your-app.vercel.app`) |
| `R2_ACCOUNT_ID`              | Yes      | Cloudflare account ID                                    |
| `R2_ACCESS_KEY_ID`           | Yes      | R2 API access key                                        |
| `R2_SECRET_ACCESS_KEY`       | Yes      | R2 API secret key                                        |
| `R2_BUCKET_NAME`             | Yes      | R2 bucket name                                           |
| `R2_PUBLIC_DOMAIN`           | Yes      | R2 public URL                                            |
| `ADMIN_PASSWORD`             | Yes      | Initial admin password                                   |
| `RESEND_API_KEY`             | No       | Email service API key                                    |
| `FROM_EMAIL`                 | No       | Sender email address                                     |
| `CALCULATOR_ALLOWED_ORIGINS` | No       | CORS origins for calculator API                          |

### Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Note your deployment URL

### Run Database Migration

After first deployment, run migrations:

```bash
# Option 1: Via Vercel CLI
npx vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Via Railway CLI
railway run npx prisma migrate deploy
```

### Seed Admin User

```bash
npx prisma db seed
```

---

## 4. Resend Email Setup (Optional)

### Create Account

1. Go to [Resend](https://resend.com) and sign up
2. Verify your domain (or use their test domain)

### Get API Key

1. Go to **API Keys** section
2. Create a new API key
3. Add to Vercel:
   - `RESEND_API_KEY`: Your API key
   - `FROM_EMAIL`: Verified sender address

---

## 5. Custom Domain (Optional)

### Add Domain in Vercel

1. Go to project **Settings** → **Domains**
2. Add your domain
3. Configure DNS records as shown

### Update Environment Variables

After adding custom domain:

1. Update `NEXTAUTH_URL` to use your custom domain
2. Redeploy for changes to take effect

---

## 6. Post-Deployment Verification

### Health Check

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "abc1234",
  "checks": {
    "database": {
      "status": "connected",
      "latency": 15
    }
  }
}
```

### Verification Checklist

- [ ] Health check returns `healthy` status
- [ ] Admin login works (`/login`)
- [ ] Dashboard loads correctly
- [ ] File uploads work (test vehicle photo upload)
- [ ] Database operations work (create a test vehicle)
- [ ] Calculator API responds (if using external calculator)

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

Solutions:

1. Verify `DATABASE_URL` is correct
2. Check Railway service is running
3. Ensure no IP allowlist is blocking Vercel

### R2 Upload Issues

**Error:** `AccessDenied` or `NoSuchBucket`

Solutions:

1. Verify all R2 credentials are correct
2. Check bucket name matches exactly
3. Ensure API token has read/write permissions

### Authentication Issues

**Error:** `NEXTAUTH_URL` mismatch

Solutions:

1. Set `NEXTAUTH_URL` to your exact deployment URL
2. Include `https://` protocol
3. Redeploy after changing

### Build Failures

**Error:** Prisma client not generated

Solutions:

1. Check `vercel.json` includes Prisma generate in build command
2. Verify `prisma/schema.prisma` is committed

---

## Environment Variable Reference

### Required Variables

| Variable               | Example                               | Description            |
| ---------------------- | ------------------------------------- | ---------------------- |
| `DATABASE_URL`         | `postgresql://user:pass@host:5432/db` | PostgreSQL connection  |
| `NEXTAUTH_SECRET`      | `abc123...` (32+ chars)               | Auth encryption key    |
| `NEXTAUTH_URL`         | `https://app.vercel.app`              | App URL with protocol  |
| `R2_ACCOUNT_ID`        | `abc123def456`                        | Cloudflare account ID  |
| `R2_ACCESS_KEY_ID`     | `access_key_here`                     | R2 API key ID          |
| `R2_SECRET_ACCESS_KEY` | `secret_key_here`                     | R2 API secret          |
| `R2_BUCKET_NAME`       | `auto-dealer-uploads`                 | R2 bucket name         |
| `R2_PUBLIC_DOMAIN`     | `bucket.r2.dev`                       | Public R2 URL          |
| `ADMIN_PASSWORD`       | `securepassword123`                   | Initial admin password |

### Optional Variables

| Variable                     | Example              | Description             |
| ---------------------------- | -------------------- | ----------------------- |
| `RESEND_API_KEY`             | `re_abc123...`       | Resend email API key    |
| `FROM_EMAIL`                 | `noreply@domain.com` | Email sender address    |
| `CALCULATOR_ALLOWED_ORIGINS` | `https://site.com`   | Calculator CORS origins |

---

## Maintenance

### Database Backups

Railway provides automatic daily backups. For manual backups:

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Monitoring

- Use Vercel Analytics for performance monitoring
- Set up uptime monitoring for `/api/health` endpoint
- Monitor Railway dashboard for database metrics

### Updates

To deploy updates:

1. Push changes to main branch
2. Vercel automatically deploys
3. Check deployment logs for errors
4. Verify health check after deployment
