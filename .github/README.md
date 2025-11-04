# GitHub Actions Configuration

This directory contains GitHub Actions workflows for The Hockey Directory.

## Workflows

### CI Workflow (`ci.yml`)
Runs on every push and pull request to main/master/develop branches.

**Jobs:**
- **Test & Lint**: Runs tests and linting on Node.js 18.x and 20.x
- **Build Check**: Verifies the application builds successfully

**Required Secrets:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for tests)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

### Deploy Workflow (`deploy.yml`)
Automatically deploys to Vercel production when code is pushed to main/master.

**Jobs:**
- **Deploy to Production**: Runs tests, then deploys to Vercel
- **Notify Deployment Status**: Reports deployment success/failure

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- All secrets from CI workflow

## Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each of the required secrets listed above

### Getting Vercel Secrets

To get your Vercel secrets for deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Get your project details
vercel project ls

# Your .vercel/project.json will contain orgId and projectId
cat .vercel/project.json
```

For the Vercel token:
1. Go to https://vercel.com/account/tokens
2. Create a new token with deployment permissions
3. Add it as `VERCEL_TOKEN` secret

## Test Coverage

The CI workflow uploads test coverage to Codecov. To view coverage reports:
1. Sign up at https://codecov.io
2. Connect your GitHub repository
3. Coverage reports will be automatically uploaded after each test run

## Local Testing

To run the same checks locally before pushing:

```bash
# Run linter
npm run lint

# Run type check
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Status Badges

Add these badges to your main README.md:

```markdown
![CI](https://github.com/miked5167/chickadee/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/miked5167/chickadee/actions/workflows/deploy.yml/badge.svg)
```

## Troubleshooting

**Build fails on type checking:**
- Run `npx tsc --noEmit` locally to see type errors
- Fix all TypeScript errors before pushing

**Tests fail in CI but pass locally:**
- Check that all required environment variables are set as secrets
- Ensure `npm ci` is used instead of `npm install` for consistent dependencies

**Deployment fails:**
- Verify all Vercel secrets are correctly set
- Check that your Vercel project is properly configured
- Review deployment logs in Vercel dashboard

## Workflow Triggers

**CI Workflow:**
- Triggers on push to main, master, or develop branches
- Triggers on pull requests to main, master, or develop branches

**Deploy Workflow:**
- Triggers on push to main or master branch
- Can be manually triggered via workflow_dispatch

## Best Practices

1. **Always run tests locally** before pushing
2. **Create feature branches** for new work
3. **Use pull requests** to merge into main/master
4. **Wait for CI to pass** before merging PRs
5. **Monitor deployment status** after merges to main
