# Environment Variables

This document provides information about the environment variables required for deploying and running iDocument.

## Required Environment Variables

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | The base URL of your application | `https://idocument.app` |
| `NEXTAUTH_SECRET` | Secret used to encrypt cookies | `your-strong-secret-key` |

### GitHub Integration

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | `abcd1234...` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | `secret1234...` |

### Database (Supabase)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abcdefg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project anonymous key | `eyJhbGciOiJIUzI...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (for admin operations) | `eyJhbGciOiJIUzI...` |

### AI Integration

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |

## Optional Environment Variables

### Monitoring

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry Data Source Name for error tracking | `https://abc@def.ingest.sentry.io/123` |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads | `sentry-token` |

### Deployment

| Variable | Description | Example |
|----------|-------------|---------|
| `VERCEL_TOKEN` | Vercel deployment token | `vercel-token` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `prj_123456...` |
| `VERCEL_ORG_ID` | Vercel organization ID | `team_123456...` |

## Environment Variables Setup by Environment

### Development

For local development, create a `.env.local` file in the root directory with the required variables.

### Production

For production environments, set the environment variables through your hosting provider's interface (e.g., Vercel, Docker, etc.).

#### Vercel

Set environment variables in the Vercel project settings.

#### Docker

Pass environment variables to your containers using the `-e` flag or an environment file.

```bash
docker run -e NEXTAUTH_URL=https://idocument.app -e NEXTAUTH_SECRET=your-secret ...
```

Or using an env file with docker-compose:

```yaml
services:
  web:
    env_file:
      - .env.production
```

## Security Considerations

- Never commit `.env` files to your repository
- Use different secrets for development and production
- Rotate secrets periodically
- Use environment-specific variables (e.g., different database credentials for development and production) 