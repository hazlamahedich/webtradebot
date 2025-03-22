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