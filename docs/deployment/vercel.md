# Deploying iDocument to Vercel

This guide provides step-by-step instructions for deploying the iDocument application to Vercel.

## Prerequisites

Before deploying to Vercel, ensure you have:

1. A [Vercel account](https://vercel.com/signup)
2. Access to the iDocument GitHub repository
3. Required environment variables (see [Environment Variables](./env-variables.md))
4. A Supabase project set up

## Deployment Steps

### 1. Connect Repository to Vercel

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Click on "Add New..." and select "Project"
3. Import your GitHub repository
4. Select the repository containing the iDocument application

### 2. Configure Project Settings

1. **Framework Preset**: Select "Next.js"
2. **Root Directory**: Keep as "/" if the project is at the root of the repository
3. **Build and Output Settings**: The defaults should work with the standard Next.js configuration

### 3. Set Up Environment Variables

1. In the "Environment Variables" section, add all required variables:
   - Authentication variables (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
   - GitHub OAuth variables (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
   - Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
   - OpenAI API key (`OPENAI_API_KEY`)
   - Any optional variables like Sentry DSN

2. Make sure to set `NEXTAUTH_URL` to your production URL (e.g., `https://idocument.vercel.app`)

### 4. Deploy the Application

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. Once complete, you'll receive a deployment URL

### 5. Set Up Custom Domain (Optional)

1. From your project dashboard, go to "Settings" > "Domains"
2. Add your custom domain and follow the verification steps
3. Update your `NEXTAUTH_URL` environment variable to match your custom domain

### 6. Configure GitHub OAuth for Production

1. Go to your GitHub OAuth application settings
2. Update the callback URL to `https://yourdomain.com/api/auth/callback/github` (replace with your actual domain)

## Continuous Deployment

Vercel automatically sets up continuous deployment from your GitHub repository. When you push changes to the main branch, Vercel will automatically deploy the updates.

### Preview Deployments

For pull requests, Vercel creates preview deployments that allow you to test changes before merging.

## Monitoring and Logs

1. On your project dashboard, navigate to "Analytics" for performance monitoring
2. Visit "Logs" to view application logs
3. Set up Sentry for more detailed error tracking

## Troubleshooting

- **Build Failures**: Check the build logs for specific errors
- **Runtime Errors**: Check the function logs and Sentry for error details
- **Authentication Issues**: Verify that your GitHub OAuth and NextAuth settings are correct
- **Database Connection**: Ensure your Supabase connection details are correct

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/solutions/nextjs)
- [Environment Variables on Vercel](https://vercel.com/docs/projects/environment-variables) 