# Deployment Guide - The Hockey Directory

This guide walks through deploying The Hockey Directory to Vercel with full production configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Setup](#vercel-setup)
3. [Environment Variables](#environment-variables)
4. [Google OAuth Configuration](#google-oauth-configuration)
5. [Email Service Setup](#email-service-setup)
6. [Image Upload Service](#image-upload-service)
7. [Staging Deployment](#staging-deployment)
8. [Production Deployment](#production-deployment)
9. [Custom Domain](#custom-domain)
10. [Monitoring Setup](#monitoring-setup)
11. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project created with database migrations applied
- [ ] GitHub repository with all code pushed
- [ ] Vercel account (free tier works for staging)
- [ ] Domain name purchased (thehockeydirectory.com)
- [ ] Google Cloud Console account for OAuth
- [ ] Email service account (Resend or SendGrid)
- [ ] Cloudinary account for image storage

---

## Vercel Setup

### 1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub repository: `miked5167/chickadee`
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### 2. Create Environments

Vercel supports three environments:
- **Development** (local development)
- **Preview** (staging - automatic for branches)
- **Production** (main branch)

By default, Vercel creates these automatically:
- Production deploys from `master` or `main` branch
- Preview deploys from all other branches and PRs

---

## Environment Variables

### Required Environment Variables

Add these in Vercel Dashboard > Project Settings > Environment Variables:

#### Supabase Configuration

```bash
# Supabase URL and Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to get these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### Google OAuth Configuration

```bash
# Google OAuth (after configuration - see section below)
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

#### Email Service Configuration

**Option 1: Resend (Recommended)**

```bash
RESEND_API_KEY=re_abc123def456
RESEND_FROM_EMAIL=noreply@thehockeydirectory.com
```

**Option 2: SendGrid**

```bash
SENDGRID_API_KEY=SG.abc123def456
SENDGRID_FROM_EMAIL=noreply@thehockeydirectory.com
```

#### Cloudinary Configuration

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456ghi789
```

#### Google Maps API (if using location features)

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAbc123Def456Ghi789
```

#### Analytics & Monitoring

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABC123DEF4

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/1234567
SENTRY_AUTH_TOKEN=abc123def456 (for sourcemaps)

# Optional: Vercel Analytics (enabled by default in Vercel)
# No configuration needed
```

#### Cron Job Security (Optional but Recommended)

```bash
CRON_SECRET=your-random-secret-key-here
```

### Environment Variable Scopes

For each variable, set the scope:
- **Production**: Production environment only
- **Preview**: Staging/preview deployments
- **Development**: Local development (optional)

**Recommendation:**
- Set all variables for **Production** and **Preview**
- Optionally set for **Development** if you want to test with Vercel dev server

---

## Google OAuth Configuration

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **"Create Credentials"** > **"OAuth 2.0 Client ID"**
5. Configure OAuth consent screen if prompted:
   - User Type: **External**
   - App Name: **The Hockey Directory**
   - User support email: your email
   - Developer contact: your email
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **The Hockey Directory**
   - Authorized JavaScript origins:
     - `https://your-project.supabase.co`
     - `https://thehockeydirectory.com` (production)
     - `https://staging.thehockeydirectory.com` (if using staging subdomain)
   - Authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
7. Save and copy:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

### 2. Configure Supabase OAuth

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Enable **Google** provider
5. Enter:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Copy the **Callback URL** (should be `https://your-project.supabase.co/auth/v1/callback`)
7. Add this callback URL to Google Cloud Console (step 1.6 above)
8. Save changes

### 3. Test OAuth Flow

1. Deploy to staging (see below)
2. Navigate to `/auth/signin`
3. Click "Sign in with Google"
4. Verify authentication works correctly

---

## Email Service Setup

### Option 1: Resend (Recommended)

**Why Resend?**
- Modern, developer-friendly API
- Great documentation
- Free tier: 3,000 emails/month
- Fast delivery
- Built for Next.js/Vercel

**Setup:**

1. Go to [Resend](https://resend.com)
2. Sign up and create an account
3. Go to **API Keys** and create a new API key
4. Copy API key → `RESEND_API_KEY`
5. Go to **Domains** and add your domain
6. Add DNS records to your domain provider:
   - Add the provided TXT, MX, and DKIM records
7. Wait for verification (usually 5-10 minutes)
8. Set `RESEND_FROM_EMAIL=noreply@thehockeydirectory.com`

**Email Templates:**
- Contact form submissions
- Review notifications
- Lead notifications
- Claim listing requests
- Password reset emails
- Welcome emails

### Option 2: SendGrid

**Setup:**

1. Go to [SendGrid](https://sendgrid.com)
2. Sign up and create an account
3. Go to **Settings** > **API Keys**
4. Create a new API key with **Full Access**
5. Copy API key → `SENDGRID_API_KEY`
6. Go to **Settings** > **Sender Authentication**
7. Verify your domain or single sender email
8. Set `SENDGRID_FROM_EMAIL=noreply@thehockeydirectory.com`

---

## Image Upload Service

### Cloudinary Setup

**Why Cloudinary?**
- Automatic image optimization
- Responsive image transformations
- CDN delivery
- Free tier: 25GB storage, 25GB bandwidth
- Upload widget for easy integration

**Setup:**

1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up and create an account
3. Go to **Dashboard**
4. Copy credentials:
   - **Cloud Name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`
5. Go to **Settings** > **Upload**
6. Create upload preset:
   - Name: `hockey_directory_logos`
   - Signing Mode: **Unsigned**
   - Folder: `advisors/logos`
   - Allowed formats: `jpg, png, webp, gif`
   - Max file size: 5MB
   - Transformation:
     - Resize: `scale`
     - Width: 400px
     - Height: 400px
     - Format: `webp`
     - Quality: `auto:good`
7. Save preset name for use in admin dashboard

**Image Categories:**
- Advisor logos: `advisors/logos/`
- Blog post images: `blog/images/`
- Team member photos: `advisors/team/`

---

## Staging Deployment

### 1. Push to GitHub

```bash
git checkout -b staging
git push origin staging
```

### 2. Configure Staging Environment

In Vercel:
1. Go to **Settings** > **Git**
2. Ensure **Preview Deployments** are enabled
3. Vercel will automatically deploy the `staging` branch

### 3. Test Staging Deployment

Once deployed, Vercel will provide a URL like:
- `https://chickadee-staging-abc123.vercel.app`

**Testing Checklist:**

- [ ] Homepage loads correctly
- [ ] Search functionality works
- [ ] Advisor listings display properly
- [ ] Blog posts load and display
- [ ] Contact form submits successfully
- [ ] Google OAuth sign-in works
- [ ] Email notifications are sent
- [ ] Image uploads work (if admin features enabled)
- [ ] Mobile responsive design looks good
- [ ] No console errors
- [ ] Supabase data loads correctly

### 4. Run Automated Tests Against Staging

```bash
# Update playwright.config.ts to point to staging URL
# Then run tests
npm run test:e2e
```

---

## Production Deployment

### 1. Final Checks

Before deploying to production:

- [ ] All staging tests pass
- [ ] All environment variables configured
- [ ] OAuth tested and working
- [ ] Email delivery tested
- [ ] Image uploads tested
- [ ] Performance tested (Lighthouse score > 90)
- [ ] Accessibility tested (WCAG 2.1 AA compliant)
- [ ] Security headers configured
- [ ] Sitemap and robots.txt working
- [ ] SSL certificate configured (automatic with Vercel)

### 2. Deploy to Production

```bash
# Merge staging to master
git checkout master
git merge staging
git push origin master
```

Vercel will automatically deploy the `master` branch to production.

### 3. Production URL

Your production site will be available at:
- `https://chickadee.vercel.app` (Vercel subdomain)
- Custom domain (after configuration - see below)

---

## Custom Domain

### 1. Add Domain to Vercel

1. Go to Vercel Dashboard > Your Project
2. Go to **Settings** > **Domains**
3. Click **"Add Domain"**
4. Enter: `thehockeydirectory.com`
5. Click **"Add"**

### 2. Configure DNS Records

Vercel will provide DNS records to add. Go to your domain provider (e.g., Namecheap, GoDaddy, Cloudflare) and add:

**For apex domain (thehockeydirectory.com):**

```
Type: A
Name: @
Value: 76.76.21.21
TTL: Automatic
```

**For www subdomain:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**Optional: Staging subdomain**

```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: Automatic
```

### 3. Wait for Verification

- DNS propagation takes 1-48 hours (usually 1-2 hours)
- Vercel will automatically issue SSL certificate via Let's Encrypt
- Once verified, your site will be accessible at `https://thehockeydirectory.com`

### 4. Set Primary Domain

1. In Vercel Dashboard > Domains
2. Click on your domain
3. Set as **"Primary Domain"**
4. All other domains will redirect to this one

---

## Monitoring Setup

### 1. Vercel Analytics (Built-in)

**Features:**
- Real-time analytics
- Core Web Vitals tracking
- Visitor tracking
- No configuration needed

**Access:**
- Vercel Dashboard > Your Project > Analytics

### 2. Google Analytics 4

**Setup:**

1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property
3. Set up data stream:
   - Platform: **Web**
   - Website URL: `https://thehockeydirectory.com`
   - Stream name: **The Hockey Directory**
4. Copy **Measurement ID** (format: `G-ABC123DEF4`)
5. Add to Vercel environment variables: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
6. The app already includes Google Analytics component (components/analytics/GoogleAnalytics.tsx)

**Verify Installation:**
1. Deploy changes
2. Visit your site
3. Go to GA4 > Reports > Realtime
4. Verify events are being tracked

### 3. Sentry Error Tracking

**Setup:**

1. Go to [Sentry](https://sentry.io)
2. Create an account and organization
3. Create a new project:
   - Platform: **Next.js**
   - Project name: **The Hockey Directory**
4. Copy **DSN** → `NEXT_PUBLIC_SENTRY_DSN`
5. Install Sentry:

```bash
npx @sentry/wizard@latest -i nextjs
```

6. Follow the wizard to configure:
   - Sentry DSN
   - Upload sourcemaps (requires `SENTRY_AUTH_TOKEN`)
   - Create `sentry.client.config.ts` and `sentry.server.config.ts`
7. Commit and push changes

**Verify Installation:**
1. Trigger a test error
2. Go to Sentry Dashboard > Issues
3. Verify error appears

### 4. UptimeRobot

**Setup:**

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Create a free account
3. Add new monitor:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: **The Hockey Directory**
   - URL: `https://thehockeydirectory.com`
   - Monitoring Interval: **5 minutes**
4. Set up alerts:
   - Email notifications
   - Slack notifications (optional)
   - SMS alerts (optional, paid)

**What it monitors:**
- Website uptime
- Response time
- SSL certificate expiration

### 5. Supabase Monitoring

Supabase provides built-in monitoring:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **Logs**
4. Monitor:
   - Database logs
   - API logs
   - Auth logs
   - Realtime logs
5. Set up **Log Drains** to forward logs to external services (optional)

---

## Post-Deployment Checklist

### Immediate (Day 1)

- [ ] Verify production site is live
- [ ] Test all critical user flows
- [ ] Verify Google Analytics tracking
- [ ] Check Sentry for any errors
- [ ] Test email notifications
- [ ] Verify OAuth flow works
- [ ] Check mobile responsiveness
- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Test SEO (sitemap, robots.txt, meta tags)
- [ ] Verify custom domain SSL certificate

### Week 1

- [ ] Monitor error rates in Sentry
- [ ] Check UptimeRobot for downtime
- [ ] Review Vercel Analytics for traffic
- [ ] Check Google Analytics for user behavior
- [ ] Monitor Supabase database performance
- [ ] Review and respond to any user feedback
- [ ] Check Core Web Vitals in Vercel Analytics
- [ ] Verify all cron jobs are running

### Ongoing

- [ ] Weekly: Review analytics and errors
- [ ] Monthly: Review performance metrics
- [ ] Quarterly: Update dependencies
- [ ] Quarterly: Review and optimize database queries
- [ ] Continuous: Monitor and fix bugs
- [ ] Continuous: Respond to user feedback

---

## Troubleshooting

### Build Failures

**Issue:** Build fails on Vercel

**Solutions:**
1. Check build logs in Vercel Dashboard
2. Run `npm run build` locally to reproduce
3. Verify all environment variables are set
4. Check for TypeScript errors
5. Ensure all dependencies are in `package.json`

### Database Connection Issues

**Issue:** Can't connect to Supabase

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is running
4. Check Supabase API logs for errors
5. Verify database migrations are applied

### OAuth Not Working

**Issue:** Google OAuth fails

**Solutions:**
1. Verify callback URL is correct in Google Console
2. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Ensure OAuth consent screen is configured
4. Verify authorized origins and redirect URIs match production URL
5. Check Supabase Auth logs for errors

### Email Not Sending

**Issue:** Email notifications not delivered

**Solutions:**
1. Verify API key is correct
2. Check domain verification status
3. Review email service logs
4. Test with a different email address
5. Check spam folder

### Performance Issues

**Issue:** Slow page load times

**Solutions:**
1. Review Vercel Analytics for bottlenecks
2. Check database query performance in Supabase
3. Optimize images with Cloudinary
4. Enable ISR for dynamic pages
5. Use caching strategies
6. Review and optimize API routes

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [Resend Documentation](https://resend.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

## Security Best Practices

### Environment Variables

- Never commit `.env` files to Git
- Use Vercel's secure environment variable storage
- Rotate API keys regularly (every 90 days)
- Use different keys for staging and production

### Authentication

- Enable 2FA for all admin accounts
- Use strong passwords
- Rotate OAuth secrets regularly
- Monitor suspicious login attempts

### Database

- Use RLS (Row Level Security) in Supabase
- Limit service role key usage to server-side only
- Review database permissions regularly
- Enable audit logging

### API Security

- Rate limit API endpoints
- Validate all user input
- Use CSRF protection
- Enable CORS only for your domain

### Monitoring

- Set up alerts for unusual activity
- Monitor error rates
- Track failed login attempts
- Review security logs weekly

---

## Support

If you encounter issues:

1. Check this documentation
2. Review Vercel logs
3. Check Supabase logs
4. Review Sentry errors
5. Consult service documentation
6. Reach out to support channels

---

**Last Updated:** November 4, 2025
**Version:** 1.0.0
**Project Status:** Ready for Deployment
