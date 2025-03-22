# Architecture Overview

This document provides an overview of the architecture of iDocument.

## System Architecture

iDocument uses a modern web application architecture with the following components:

```
┌────────────────────┐           ┌────────────────────┐
│                    │           │                    │
│    Next.js App     │◄─────────►│  GitHub API        │
│    (Frontend +     │           │                    │
│     API Routes)    │           └────────────────────┘
│                    │           
└─────────┬──────────┘           ┌────────────────────┐
          │                      │                    │
          │                      │  OpenAI API        │
          │                      │                    │
          ▼                      └────────────────────┘
┌────────────────────┐                    ▲
│                    │                    │
│     Supabase       │                    │
│     Database       │                    │
│                    │           ┌────────┴───────────┐
└────────────────────┘           │                    │
                                │  LangChain /        │
                                │  LangGraph          │
                                │                    │
                                └────────────────────┘
```

## Component Overview

### Frontend

- Built with Next.js and React
- Uses the App Router for routing and React Server Components
- UI components from shadcn/ui with Tailwind CSS for styling
- Authentication handled by NextAuth.js

### Backend

- Next.js API routes for serverless functions
- GitHub integration for repository access and webhook handling
- LangChain and LangGraph for AI workflow orchestration
- OpenAI API for code analysis and review generation

### Database

- Supabase PostgreSQL database
- Stores user data, repository information, and review history
- Real-time subscriptions for live updates

## Authentication Flow

1. User authenticates via GitHub OAuth
2. NextAuth.js handles the OAuth flow and session management
3. GitHub tokens are securely stored for API access

## Code Review Process

1. GitHub webhook notifies when a new PR is created or updated
2. System fetches PR details and code changes via GitHub API
3. LangGraph orchestrates the review workflow:
   - Analyze code changes
   - Generate suggestions
   - Provide explanations
4. Results are stored in the database and displayed to the user

## Data Flow

1. User connects GitHub repositories
2. Pull request events trigger reviews
3. AI generates review content
4. User interacts with reviews
5. Analytics are aggregated from interactions

## Key Design Decisions

1. **Next.js App Router**: Enables React Server Components for improved performance
2. **Supabase**: Provides real-time database capabilities and authentication
3. **LangGraph**: Allows for complex, multi-step AI workflows
4. **GitHub OAuth**: Streamlines access to repositories

## Directory Structure

- `/app`: Next.js application routes
- `/components`: Reusable UI components
- `/lib`: Utility functions and shared code
- `/api`: API route handlers (within /app/api)
- `/hooks`: Custom React hooks
- `/styles`: Global styling (Tailwind configuration)
- `/public`: Static assets 