# Deployment Checklist - Quick Start Guide

Use this checklist to deploy The Hockey Directory step-by-step. For detailed instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Pre-Deployment Setup

### 1. Vercel Account Setup
- [ ] Create account at https://vercel.com
- [ ] Import GitHub repository: `miked5167/chickadee`
- [ ] Connect repository to Vercel

### 2. Supabase Environment Variables
Get from: https://supabase.com/dashboard → Your Project → Settings → API

- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy `SUPABASE_SERVICE_ROLE_KEY`

### 3. Google OAuth Setup
Setup at: https://console.cloud.google.com

- [ ] Create OAuth 2.0 Client ID
- [ ] Get `GOOGLE_CLIENT_ID`
- [ ] Get `GOOGLE_CLIENT_SECRET`
- [ ] Add callback URL: `https://your-project.supabase.co/auth/v1/callback`
- [ ] Configure in Supabase: Authentication → Providers → Google

### 4. Email Service Setup (Choose One)

**Option A: Resend (Recommended)**
- [ ] Sign up at https://resend.com
- [ ] Create API key → `RESEND_API_KEY`
- [ ] Verify domain
- [ ] Set `RESEND_FROM_EMAIL=noreply@thehockeydirectory.com`

**Option B: SendGrid**
- [ ] Sign up at https://sendgrid.com
- [ ] Create API key → `SENDGRID_API_KEY`
- [ ] Verify sender
- [ ] Set `SENDGRID_FROM_EMAIL=noreply@thehockeydirectory.com`

### 5. Cloudinary Setup
Setup at: https://cloudinary.com

- [ ] Create account
- [ ] Get `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] Get `CLOUDINARY_API_KEY`
- [ ] Get `CLOUDINARY_API_SECRET`
- [ ] Create upload preset: `hockey_directory_logos`

### 6. Google Maps API (Optional)
- [ ] Enable Maps JavaScript API
- [ ] Get `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 7. Analytics & Monitoring

**Google Analytics 4**
- [ ] Create GA4 property at https://analytics.google.com
- [ ] Get `NEXT_PUBLIC_GA_MEASUREMENT_ID`

**Sentry (Optional)**
- [ ] Create project at https://sentry.io
- [ ] Get `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Run: `npx @sentry/wizard@latest -i nextjs`

**UptimeRobot (Optional)**
- [ ] Create monitor at https://uptimerobot.com
- [ ] Add URL: `https://thehockeydirectory.com`

## Environment Variables Setup

### In Vercel Dashboard

Go to: Project Settings → Environment Variables

Add these for **Production** and **Preview**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# Email Service
RESEND_API_KEY=re_abc123def456
RESEND_FROM_EMAIL=noreply@thehockeydirectory.com

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456ghi789

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAbc123Def456Ghi789

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABC123DEF4
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456789.ingest.sentry.io/1234567

# App Config
NEXT_PUBLIC_APP_URL=https://thehockeydirectory.com

# Security
CRON_SECRET=your-random-secret-here
```

## Staging Deployment

### 1. Create Staging Branch
```bash
git checkout -b staging
git push origin staging
```

### 2. Verify Staging Deployment
- [ ] Check Vercel dashboard for deployment status
- [ ] Visit staging URL: `https://chickadee-staging-*.vercel.app`
- [ ] Test all features

### 3. Run Tests Against Staging
```bash
# Update BASE_URL in playwright.config.ts
npm run test:e2e
```

## Production Deployment

### 1. Final Pre-Flight Checks
- [ ] All environment variables set
- [ ] OAuth working on staging
- [ ] Email delivery working on staging
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] No console errors

### 2. Deploy to Production
```bash
git checkout master
git merge staging
git push origin master
```

### 3. Verify Production
- [ ] Check Vercel deployment status
- [ ] Visit: `https://chickadee.vercel.app`
- [ ] Test critical flows:
  - Homepage loads
  - Search works
  - Sign in with Google works
  - Contact form sends emails
  - Advisor pages load

## Custom Domain Setup

### 1. Add Domain in Vercel
- [ ] Go to: Project Settings → Domains
- [ ] Add: `thehockeydirectory.com`
- [ ] Add: `www.thehockeydirectory.com`

### 2. Configure DNS
Add these records at your domain provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Wait for Verification
- [ ] DNS propagation (1-48 hours, usually 1-2 hours)
- [ ] SSL certificate issued automatically
- [ ] Set primary domain in Vercel

## Post-Deployment

### Immediate Checks
- [ ] Site accessible at custom domain
- [ ] SSL certificate active (🔒 in browser)
- [ ] Google Analytics tracking
- [ ] Sentry error tracking
- [ ] UptimeRobot monitoring
- [ ] All features working

### Monitor First Week
- [ ] Check Vercel Analytics daily
- [ ] Review Sentry errors daily
- [ ] Monitor UptimeRobot alerts
- [ ] Check Google Analytics reports
- [ ] Review Supabase logs
- [ ] Test email delivery

## Troubleshooting

### Build Fails
```bash
# Test locally
npm run build

# Check environment variables
# Review build logs in Vercel
```

### OAuth Not Working
- Verify callback URL matches in Google Console
- Check OAuth credentials in Vercel
- Test on incognito/private browsing

### Emails Not Sending
- Verify API key is correct
- Check domain verification status
- Test with different email address
- Review service logs

### Database Connection Failed
- Verify Supabase URL and keys
- Check Supabase project status
- Review database logs

## Support Resources

- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Status**: Ready for Deployment
**Last Updated**: November 4, 2025

## Quick Command Reference

```bash
# Deploy to staging
git checkout -b staging
git push origin staging

# Deploy to production
git checkout master
git merge staging
git push origin master

# Run tests
npm run test          # Unit tests
npm run test:e2e      # E2E tests

# Build locally
npm run build
npm run start

# Development
npm run dev
```
