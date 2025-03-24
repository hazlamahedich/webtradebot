# iDocument - AI-Powered Documentation

iDocument is an AI-powered documentation system that automatically generates comprehensive documentation from your GitHub repository code.

## Features

- GitHub OAuth Authentication
- Repository integration
- AI-driven code analysis
- Automated documentation generation
- Clean, modern UI

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- PostgreSQL database (or Supabase account)
- GitHub account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/idocument.git
cd idocument
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy the `.env.example` file to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXTAUTH_URL`: Your application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: A secret string for NextAuth.js (generate with `openssl rand -base64 32`)
- `GITHUB_ID`: GitHub OAuth App client ID
- `GITHUB_SECRET`: GitHub OAuth App client secret
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key

4. Set up GitHub OAuth:

   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Create a new OAuth App
   - Set the Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env.local` file

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication System

iDocument uses [NextAuth.js](https://next-auth.js.org/) for authentication with a GitHub OAuth provider. Authentication flow:

1. User clicks "Sign In with GitHub"
2. User is redirected to GitHub for authorization
3. GitHub redirects back to the application with an authorization code
4. The server exchanges the code for an access token
5. User information is retrieved and a session is created
6. The user is redirected to the dashboard

## Architecture

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Authentication**: NextAuth.js with GitHub provider
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API, LangChain, LangGraph

## Development

### Database Setup

The application uses Supabase for the database. The schema is defined in `lib/supabase/schema.ts` and migrations are in `lib/supabase/migrations/`.

To apply migrations:

```bash
npm run db:migrate
```

### Testing

Run the test suite:

```bash
npm test
```

Or run tests in watch mode:

```bash
npm run test:watch
```

## Deployment

### Docker

You can run the application using Docker:

```bash
docker-compose up
```

### Vercel

The application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure the environment variables
4. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details. 