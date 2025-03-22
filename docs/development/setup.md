# Setting Up the Development Environment

This guide will help you set up your local development environment for iDocument.

## Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- Git
- GitHub account
- Supabase account (for database)
- OpenAI API key

## Installation Steps

1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/idocument.git
cd idocument
```

2. **Install Dependencies**

```bash
npm install
```

3. **Set Up Environment Variables**

Create a `.env.local` file in the root directory with the following variables:

```
# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI (OpenAI)
OPENAI_API_KEY=your-openai-api-key
```

4. **Set Up Supabase**

- Create a new Supabase project
- Run the database initialization SQL script from `scripts/db-init.sql`
- Update your `.env.local` file with the Supabase credentials

5. **Set Up GitHub OAuth App**

- Go to GitHub Developer Settings
- Create a new OAuth App
- Set the callback URL to `http://localhost:3000/api/auth/callback/github`
- Update your `.env.local` file with the GitHub credentials

6. **Start the Development Server**

```bash
npm run dev
```

7. **Access the Application**

Open your browser and navigate to `http://localhost:3000`

## Troubleshooting

- If you encounter authentication issues, check your GitHub OAuth configuration
- For database issues, verify your Supabase credentials and connection
- For API errors, check your OpenAI API key and request logs

## Next Steps

Once your development environment is set up, review the [Architecture Overview](./architecture.md) to understand the system structure. 