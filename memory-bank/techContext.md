# iDocument: Technical Context

## Technologies Used
1. **Frontend**:
   - Next.js 14+ (App Router)
   - React 19
   - TypeScript
   - Tailwind CSS
   - shadcn/ui components
   - Sonner for toast notifications
   - Lucide React for icons
   - React Markdown for documentation rendering
   - Mermaid.js for diagram visualization

2. **Backend**:
   - Next.js API Routes with Edge Runtime
   - LangChain for LLM integration
   - LangGraph for AI workflow
   - Supabase for database, caching, and real-time features
   - NextAuth.js for authentication

3. **External Services**:
   - GitHub API for repository integration
   - OpenAI API for code analysis and documentation generation

## Development Setup
1. **Environment**:
   - Node.js v18+
   - npm for package management
   - Environment variables in .env.local

2. **Local Development**:
   - `npm run dev` for development server
   - `npm run build` for production build
   - `npm run lint` for code linting

3. **Testing**:
   - React Testing Library
   - Jest for unit and integration tests

## Technical Constraints
1. **AI Processing**:
   - OpenAI token limits for code analysis and documentation generation
   - Request rate limits for GitHub API
   - Cost optimization for LLM usage
   - Context window limitations for large codebases
   - Vercel serverless function 10s timeout limit
   - Edge Functions 30s timeout limit

2. **Security**:
   - GitHub token scopes and permissions
   - Environment variable protection
   - Secure handling of repository code

3. **Performance**:
   - Optimizing AI processing time
   - Client-side rendering for interactive components
   - Server-side rendering for initial loading
   - Efficient handling of large documentation sets
   - Chunked AI processing for serverless functions
   - Response streaming for progressive loading

## Deployment
1. **Vercel Free Tier Optimization**:
   - Edge Runtime for long-running AI operations
   - Chunked processing to avoid timeouts
   - Background processing via webhooks
   - Response streaming for faster initial loads
   - Aggressive caching of AI responses
   - Smaller AI models for edge functions

2. **Resource Constraints**:
   - Serverless function 10s timeout limit
   - Edge function 30s timeout limit
   - 100GB bandwidth/month
   - Limited build minutes
   - 100 deployments per day

3. **Mitigation Strategies**:
   - Split AI processing into smaller chunks
   - Use background processing patterns
   - Cache AI responses in Supabase
   - Implement progressive enhancement
   - Optimize token usage with compression

## Dependencies
1. **Core**:
   - next: ^14
   - react: ^19
   - react-dom: ^19
   - typescript: ^5

2. **UI**:
   - tailwindcss: ^4
   - shadcn/ui components
   - sonner: ^1.0
   - lucide-react: ^0.284
   - react-markdown: ^8.0.7
   - react-mermaid: ^0.1.3
   - react-syntax-highlighter: ^15.5.0

3. **Backend**:
   - next-auth: ^5.0.0-beta.25
   - @supabase/supabase-js: ^2.38
   - langchain: ^0.0.120
   - @langchain/core: ^0.1.14
   - @langchain/openai: ^0.0.12
   - @langchain/langgraph: ^0.0.21
   - zod: ^3.22

4. **Documentation Generation**:
   - @langchain/community: ^0.0.20
   - unified: ^10.1.2
   - remark-parse: ^10.0.2
   - remark-gfm: ^3.0.1
   - mermaid: ^10.6.1

# GitHub Integration

## Authentication
- GitHub OAuth integration using NextAuth.js
- Access token stored in accounts table
- GitHub user ID used as primary user identifier
- Session includes GitHub access token for API calls
- Automatic repository migration for user ID changes

## Repository Connection
- Repository lookup by full name (username/repository)
- GitHub API calls secured with user's OAuth token
- Repository data stored in repositories table with user association
- Fix endpoints for handling connection issues
- Case-insensitive repository matching

## Accounts System
- Two-table architecture: users and accounts
- users table stores user profile information
- accounts table stores OAuth provider data including tokens
- Diagnostic endpoints for checking account status
- Fix utility to create missing account records

## Common Issues and Solutions
- Missing account records: Use fix-github-account API endpoint
- Repository already exists: Option to force-add with confirmation
- User ID mismatch: Automatic migration of repositories between user IDs
- Authentication failures: Session diagnostics in debug endpoint

## Testing Technology Stack

### Unit and Integration Testing
- **Jest**: Primary testing framework
- **ts-jest**: TypeScript support for Jest tests
- **@testing-library/react**: For UI component testing
- **@testing-library/user-event**: For simulating user interactions
- **jest-environment-jsdom**: Browser-like environment for UI tests

### Test Organization
- **Test Directory Structure**:
  - `__tests__/ai/`: AI component tests
  - `__tests__/api/webhooks/`: Webhook processing tests
  - `__tests__/components/`: UI component tests
  - `__tests__/pages/`: Next.js page tests
  - `__tests__/lib/`: Utility function tests

### Mock Infrastructure
- **jest.mock()**: Mock external dependencies
- **jest.fn()**: Create mock functions with predefined returns
- **jest.isolateModules()**: Isolate module imports to prevent conflicts
- **__mocks__/**: Directory for centralized mock modules
- **moduleNameMapper** in Jest config to redirect problematic imports

### CI Testing
- **GitHub Actions**: Automated test workflow
- **Package Scripts**: Custom test commands in package.json
- **Coverage Reports**: Generated with Jest's coverage options
- **Artifact uploads**: Store test results for analysis

## Authentication Technologies

### NextAuth.js
- Version: 5.0.0
- Implementation: OAuth-based authentication with GitHub provider
- File Structure:
  - `lib/auth.ts`: Main authentication configuration
  - `app/api/auth/[...nextauth]/route.ts`: API route handler
  - `middleware.ts`: Authentication middleware for protected routes
  - `app/providers.tsx`: AuthProvider for client components

### Authentication Features
- Sessions stored in HTTP-only cookies for security
- JWT token-based authentication
- CSRF protection built-in
- Custom sign-in page with error handling
- Secure redirect handling
- User profile information display
- Sign-out functionality with redirect

### GitHub OAuth
- OAuth 2.0 implementation
- Required Scopes: `user:email`, `read:user`
- Callback URL: `/api/auth/callback/github`
- Configuration in .env:
  - `GITHUB_ID`: GitHub OAuth app client ID
  - `GITHUB_SECRET`: GitHub OAuth app client secret

## Core Technologies

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- shadcn/ui components

### Backend
- Next.js API Routes
- Server Components
- Server Actions

### Database
- Supabase PostgreSQL
- Table Structure:
  - users: User profiles
  - accounts: OAuth connections
  - sessions: User sessions
  - repositories: GitHub repositories
  - documents: Generated documentation

### AI
- OpenAI API (GPT-4 and GPT-3.5)
- Anthropic Claude API
- LangChain
- LangGraph for workflow orchestration

## Development Environment

### Tools
- Node.js 18+
- npm 8+
- Git
- VS Code (recommended)
- GitHub CLI (optional)

### Local Setup
- Environment Variables:
  - Authentication: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`
  - Database: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - AI: `OPENAI_API_KEY`

### Testing
- Jest for unit and integration tests
- Testing utilities for authentication mocking

## Deployment

### Hosting
- Vercel (production)
- Docker (optional)

### CI/CD
- GitHub Actions
- Automated testing pipeline
- Environment configuration
- Security scanning

## Dependencies

### Key Authentication Dependencies
- next-auth@5.0.0
- @vercel/postgres (for database access)
- @auth/core
- @auth/supabase-adapter (when using Supabase) 