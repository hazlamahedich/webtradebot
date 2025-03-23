# Development Guide

This guide provides information for developers who want to contribute to or extend the iDocument Code Review Assistant.

## Table of Contents

- [Project Structure](./project-structure.md)
- [Development Environment Setup](./environment-setup.md)
- [API Documentation](./api-documentation.md)
- [LLM Integration](./llm-integration.md)
- [Contributing Guidelines](./contributing.md)
- [Testing](./testing.md)
- [Code Style Guide](./code-style.md)
- [Architecture Overview](./architecture.md)

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your environment variables (see `.env.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

For more detailed instructions, see the [Development Environment Setup](./environment-setup.md) guide.

## Tech Stack

- **Frontend**: Next.js with Tailwind CSS and shadcn/ui
- **Backend**: Next.js API routes with LangGraph and LangChain
- **Database**: Supabase
- **Authentication**: NextAuth.js with GitHub OAuth

## Testing

For information on testing, see the [Testing](./testing.md) documentation. 