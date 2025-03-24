# iDocument: System Patterns

## System Architecture
iDocument follows a modern web application architecture:
1. **Next.js App Router**: Server-first approach with React Server Components
2. **API Layer**: Next.js API routes with Edge Runtime for long-running operations
3. **Database Layer**: Supabase for data storage, caching, and real-time updates
4. **AI Processing Layer**: LangChain and LangGraph for code analysis and documentation generation
5. **GitHub Integration Layer**: API communication for repository access
6. **Edge Processing Layer**: Optimized AI routines for serverless environment

## Key Technical Decisions
1. **Server Components**: Using React Server Components for improved performance
2. **Edge Compatibility**: Designing for deployment on edge networks
3. **Token Handling**: Secure management of GitHub tokens with NextAuth
4. **Real-time Updates**: Leveraging Supabase real-time capabilities for collaborative features
5. **LLM Optimizations**: Structuring prompts and context for efficient AI processing
6. **Parallel AI Workflows**: Separate LangGraph workflows for different AI features (code review, documentation)
7. **Chunked Processing**: Breaking AI tasks into smaller units to work within serverless constraints
8. **Progressive Loading**: Streaming responses to show results as they're generated

## Design Patterns
1. **Feature-based Organization**: Code organized by feature rather than technical role
2. **Server Actions**: Using Next.js server actions for form submissions
3. **State Management**: Combination of React Context and server-side state
4. **Component Composition**: Building complex UI from smaller, reusable components
5. **Chain of Responsibility**: LangChain pattern for processing code reviews and generating documentation
6. **State Machine**: LangGraph pattern for managing the review and documentation workflows
7. **Publish-Subscribe**: Event-based triggering of documentation generation when code changes
8. **Background Processing**: Webhook-based continuation of long-running tasks
9. **Caching Strategy**: AI response caching for performance optimization
10. **Model Adaptation**: Selecting appropriate AI models based on runtime context

## Component Relationships
1. **Authentication Flow**:
   - NextAuth.js → GitHub OAuth → User Session → Protected Routes

2. **GitHub Integration**:
   - Repository Connection → Webhook Registration → PR Events → Review Triggers

3. **Review Process**:
   - Code Diff → LangGraph Analysis → Review Generation → Suggestion Display

4. **Documentation Process**:
   - Repository Access → Task Chunking → Incremental Processing → Progressive Assembly → Final Documentation

5. **User Dashboard**:
   - Authentication → User Data → Repositories → PRs → Review History → Documentation

6. **Team Collaboration**:
   - Organization Structure → Team Permissions → Shared Reviews → Documentation Access
   
7. **Serverless Optimization Flow**:
   - Initial Request → Edge Function → Task Chunking → Webhook Triggers → Progressive Processing → Result Assembly

## Optimization Patterns
1. **AI Task Decomposition**:
   - Breaking complex AI tasks into smaller, independent chunks
   - Processing each chunk within serverless timeout constraints
   - Assembling results progressively for a complete response

2. **Response Streaming**:
   - Progressive loading of AI-generated content
   - Immediate display of partial results as they become available
   - Background processing of remaining content

3. **Tiered Model Selection**:
   - Using smaller, faster models for edge functions
   - Selecting appropriate model based on complexity and context size
   - Falling back to more powerful models when necessary

4. **Smart Caching**:
   - Caching AI responses based on input determinism
   - Invalidating cache based on repository changes
   - Progressive cache updates for partial results

# GitHub Integration System

## Architecture
- NextAuth.js for GitHub OAuth authentication
- Two-table authentication system (users and accounts)
- Repository management through GitHub API
- Consistent user identification via GitHub provider ID
- Session-based access token storage for API requests

## Patterns
- Repository connection with secure token handling
- User-friendly error diagnostics and recovery
- Automatic repository migration between user IDs
- Case-insensitive repository matching
- Self-healing authentication issues

## Implementation Details
- GitHub account data stored in accounts table
- Repository data stored in repositories table with user association
- Fix utilities for handling connection edge cases
- Debug endpoints for system diagnostics
- Authentication error recovery mechanisms

## Examples
```typescript
// GitHub authentication with NextAuth.js
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Use GitHub ID consistently for the user ID
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      
      // Include access token in session
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      
      return session;
    },
    async jwt({ token, account }) {
      // Store GitHub access token
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
});

// GitHub repository connection
export async function addRepository(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  
  // Get GitHub token from user's account
  const account = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1);
    
  const token = account[0].access_token;
  
  // Call GitHub API with user's token
  const response = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  
  // Save repository data to database
  const result = await db.insert(repositories).values({
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    url: repo.html_url,
    userId: userId,
  });
}

# Code Review System

## Architecture
- Automated code review triggered by GitHub webhooks
- Webhook handlers for pull request events (opened, synchronize)
- Parallel review and documentation analysis processes
- Database tracking of PRs and review status
- Integration with GitHub API for PR details and comments

## Review Process Flow
1. **Webhook Reception**:
   - GitHub sends webhook events to /api/webhooks/github/route.ts
   - Webhook signature is verified for security
   - Event type and action are extracted for processing

2. **PR Event Handling**:
   - handlePRReviewEvent processes pull_request events
   - Only 'opened' and 'synchronize' actions trigger reviews
   - PR data is extracted and normalized for processing

3. **Database Operations**:
   - System checks if repository exists in database
   - Creates or updates pull request record
   - Creates new review record or updates existing one
   - Tracks review status (queued, in_progress, completed, failed)

4. **AI Review Generation**:
   - startCodeReviewFlow initiates LangGraph workflow
   - GitHub API fetches PR details and file changes
   - Code is analyzed for bugs, improvements, and best practices
   - Review results are structured and stored in the database

5. **Review Publishing**:
   - When review completes, postReviewCommentOnPR is triggered
   - Review results are formatted as GitHub comment
   - Comment is posted to the PR using GitHub API
   - Review status is updated to 'completed'

## Implementation Details
```typescript
// Webhook handler for GitHub events
export async function POST(req: Request) {
  try {
    // Get event type from headers
    const eventType = headers().get('x-github-event');
    
    // Verify webhook signature
    const signature = headers().get('x-hub-signature-256');
    const isValid = verifySignature(await req.text(), signature);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse payload and handle PR events
    const payload = await req.json();
    
    if (eventType === 'pull_request') {
      // Trigger review handlers
      await handlePRWebhook(eventType, payload);
      await handlePRReviewEvent(eventType, payload);
    }
  } catch (error) {
    return NextResponse.json({ error: `Failed to process webhook: ${error.message}` }, { status: 500 });
  }
}

// PR Review event handler
export async function handlePRReviewEvent(event: string, payload: any) {
  // Only handle opened or updated PRs
  if (payload.action === 'opened' || payload.action === 'synchronize') {
    await createCodeReviewForPR(
      payload.repository.owner.login,
      payload.repository.name,
      payload.pull_request.number,
      {
        id: String(payload.pull_request.id),
        number: payload.pull_request.number,
        title: payload.pull_request.title,
        // Additional PR details...
      }
    );
  }
}

// Code review creation
export async function createCodeReviewForPR(owner: string, repo: string, pullNumber: number, pullRequest: any) {
  // Check if repository exists in database
  const repository = await db.query.repositories.findFirst({
    where: eq(repositories.fullName, `${owner}/${repo}`),
  });
  
  if (!repository) {
    return { success: false, error: `Repository ${owner}/${repo} not found in database` };
  }
  
  // Create or update PR record
  let prId;
  const existingPR = await db.query.pullRequests.findFirst({
    where: and(
      eq(pullRequests.repositoryId, repository.id),
      eq(pullRequests.number, pullNumber)
    ),
  });
  
  if (existingPR) {
    // Update existing PR
    prId = existingPR.id;
  } else {
    // Create new PR record
    const insertResult = await db.insert(pullRequests)
      .values({
        repositoryId: repository.id,
        number: pullNumber,
        title: pullRequest.title,
        // Additional PR details...
      })
      .returning({ id: pullRequests.id });
    
    prId = insertResult[0].id;
  }
  
  // Create or update review record
  let reviewId;
  const existingReview = await db.query.codeReviews.findFirst({
    where: eq(codeReviews.pullRequestId, prId),
  });
  
  if (existingReview && existingReview.status === 'failed') {
    // Update failed review
    reviewId = existingReview.id;
    await db.update(codeReviews)
      .set({ status: 'queued', updatedAt: new Date() })
      .where(eq(codeReviews.id, reviewId));
  } else if (!existingReview) {
    // Create new review
    const insertResult = await db.insert(codeReviews)
      .values({
        pullRequestId: prId,
        status: 'queued',
      })
      .returning({ id: codeReviews.id });
    
    reviewId = insertResult[0].id;
  } else {
    // Use existing review
    reviewId = existingReview.id;
  }
  
  // Start the code review flow
  await startCodeReviewFlow({
    reviewId,
    owner,
    repo,
    pullNumber,
  });
  
  return { success: true, reviewId };
}

## Code Review Processing Patterns
1. **Parallel Processing**: Documentation and code review run in parallel workflows
2. **Status Tracking**: Database records track review progress and status
3. **Error Recovery**: Failed reviews can be retried or restarted
4. **Incremental Analysis**: Code is analyzed at the file level with context awareness
5. **Smart Suggestions**: Review results include specific suggestions with locations
6. **Automated Publishing**: Comments are automatically posted to GitHub PRs
7. **Event-Driven Architecture**: Webhooks trigger reviews without user intervention

## AI Testing Architecture

### Test Organization Pattern
- Tests are organized by AI component functionality
- Each major AI feature has dedicated test files:
  - `code-review-minimal.test.ts` - Core code review functionality
  - `documentation-prompts.test.ts` - Prompt template testing
  - `models.test.ts` - AI model configuration tests
  - `pr-review-integration.test.ts` - PR review workflow
- Mock modules are used to avoid duplicate declaration issues
- Jest isolation is used to prevent test interference

### Mock System
- External dependencies are consistently mocked:
  - OpenAI API calls return predefined responses
  - GitHub API operations use consistent mock patterns
  - Database operations use Jest mock functions
  - LangChain components return structured mock data
- Mock modules are centralized in `__mocks__` directory
- Virtual mocks used for problematic modules with `{ virtual: true }`

### CI Integration
- GitHub Actions workflow defined in `.github/workflows/test-documentation.yml`
- CI runs different test groups:
  - AI component tests
  - Documentation generator core tests
  - Documentation webhook tests
- Test coverage artifacts are uploaded for analysis
- Configuration uses environment variables for database and API keys

# System Patterns

## Authentication Architecture

### NextAuth Integration
- Using NextAuth.js with GitHub OAuth provider for authentication
- Session management with secure HTTP-only cookies
- Middleware for protected route access control
- AuthProvider component for client-side session access

### Session Flow
1. User initiates sign-in via the sign-in page
2. NextAuth redirects to GitHub OAuth login
3. GitHub authorizes user and redirects back with authorization code
4. NextAuth exchanges code for access token and creates session
5. Session token stored in secure cookie
6. User redirected to dashboard or requested protected page
7. Middleware checks session cookie on protected routes
8. Client components access session via useSession() hook

### User Data Storage
- Users stored in database with GitHub ID as primary identifier
- OAuth accounts linked to users via provider ID and user ID relationship
- GitHub access tokens stored securely for API operations
- User profile data (name, email, image) from GitHub stored in users table

### Protected Routes
- All routes under /dashboard/* require authentication
- Middleware automatically redirects unauthenticated users to sign-in
- API routes check authentication status before processing requests
- Session token validation occurs on both client and server

### Error Handling
- Failed authentication redirects to dedicated error page
- Expired sessions trigger automatic sign-out
- Missing GitHub connection handled with diagnostic tools
- Clear user feedback for authentication issues

## Front-End Architecture

### Component Hierarchy
- RootLayout includes Providers wrapper (ThemeProvider, AuthProvider)
- DashboardLayout provides authenticated navigation and user profile
- Page components handle specific functionality
- UI components from shadcn/ui for consistent design

### State Management
- React context for theme and authentication state
- React Query for data fetching and caching
- Local state for UI interactions
- Server state from server components

### Styling Approach
- Tailwind CSS for utility-first styling
- shadcn/ui components for consistent UI elements
- Custom components extend shadcn/ui when needed
- Dark mode support via ThemeProvider

## API Architecture

### Route Structure
- API routes under /app/api/
- Authentication API routes under /app/api/auth/
- Repository API routes under /app/api/repositories/
- Documentation API routes under /app/api/documentation/

### Server Actions
- Form submissions via React Server Actions
- Data mutations through authenticated API endpoints
- Server-side validation for all inputs
- Error handling with appropriate status codes

## Database Architecture

### Schema
- users table for user profiles
- accounts table for OAuth connections
- sessions table for session management
- repositories table for connected GitHub repositories
- documents table for generated documentation

### Relationships
- One-to-many: User to Repositories
- One-to-many: Repository to Documents
- One-to-many: User to Sessions
- One-to-many: User to Accounts

## GitHub Integration

### OAuth Connection
- GitHub OAuth App for user authentication
- Access tokens stored in accounts table
- Refresh token flow for expired tokens
- Scope limited to necessary operations

### API Usage
- Repository data fetched using GitHub REST API
- Webhook events for PR notifications
- Repository content access for documentation generation
- Comments posting for code reviews