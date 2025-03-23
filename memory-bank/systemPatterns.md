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