# iDocument: Active Context

## Current Work Focus
We have completed Phase 4 (Launch) and are now focused on completing Phase 1 (Foundation) and beginning Phase 2 (Core Features):
1. Setting up the Next.js project structure with App Router
2. Implementing basic UI components with shadcn/ui
3. Configuring authentication with NextAuth.js and GitHub OAuth
4. Creating the Supabase database schema
5. Setting up the initial LangChain infrastructure
6. Implementing the Documentation Generator feature
7. Optimizing for Vercel free tier deployment

## Recent Changes
- Implemented Documentation Generator feature with LangGraph workflow
- Added documentation generation UI with repository input and history view
- Created documentation detail pages with component breakdowns and diagrams
- Extended Supabase schema to support documentation storage and versioning
- Added API endpoints for documentation generation and retrieval
- Completed comprehensive documentation for users, developers, and deployment
- Set up testing infrastructure with Jest and React Testing Library
- Configured CI/CD pipeline with GitHub Actions
- Created Docker and docker-compose configurations for containerized deployment
- Implemented monitoring and error tracking with Sentry
- Updated project progress tracking
- **New**: Optimized AI processing for Vercel's free tier constraints
- **New**: Implemented chunked processing with webhook-based continuation
- **New**: Added Edge Runtime support for longer-running operations
- **New**: Created caching system for AI responses
- **New**: Added tiered model selection based on runtime context
- **New**: Implemented advanced documentation features from Phase 3:
  - Added diagram generation using LangGraph and Mermaid.js
  - Built advanced search capabilities with semantic matching
  - Created export functionality for multiple document formats
  - Integrated documentation generation with PR workflow via webhooks

## Next Steps
1. Create the proper GitHub OAuth configuration
2. Implement the authentication flow with NextAuth.js
3. Complete the Supabase database schema for users, repositories, and reviews
4. Create the basic UI layout with header, sidebar, and main content area
5. Implement the initial GitHub integration for accessing repositories
6. Test and refine the edge-optimized processing system
7. Implement client-side streaming UI for progressive loading
8. Monitor performance and adjust chunking strategy as needed
9. Begin implementing other Phase 3 enhancements:
   - Team collaboration features
   - Analytics and insights dashboard
   - Advanced review options
   - Enhanced caching strategies
   - Fallback mechanisms for processing failures

## Active Decisions
1. Using Next.js App Router for modern React Server Components approach
2. Choosing shadcn/ui for flexible, accessible UI components
3. Leveraging LangChain and LangGraph for modular AI workflow architecture
4. Using Supabase for database, authentication, real-time features, and caching
5. Implementing GitHub OAuth for seamless developer experience
6. Deploying with Vercel (free tier) with optimized serverless architecture
7. Building the Documentation Generator as a separate feature with its own LangGraph workflow
8. Using Edge Runtime for longer-running AI operations
9. Implementing chunked processing to work within serverless constraints
10. Adding caching to optimize performance and reduce API costs

## Current Considerations
- Ensuring secure handling of GitHub tokens and repository data
- Optimizing the AI review and documentation workflows for performance and cost
- Designing the database schema for scalability
- Planning the proper permission system for team collaboration
- Structuring the codebase for maintainability and future expansion
- Ensuring CI/CD pipeline effectiveness
- Balancing documentation quality with generation speed
- Managing serverless function timeouts with efficient chunking
- Optimizing for Vercel's free tier bandwidth and build limitations
- Implementing fallback strategies for edge cases 