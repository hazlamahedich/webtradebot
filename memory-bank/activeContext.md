# Active Development Context

## Current Focus
Authentication system has been rebuilt using NextAuth with GitHub OAuth provider. The system is now fully integrated into the application.

## Recent Changes
- Implemented NextAuth authentication with GitHub OAuth
- Created a dedicated sign-in page with improved UI
- Added session management with middleware for protected routes
- Created an AuthProvider component for providing authentication context
- Updated dashboard to display user information and statistics
- Implemented sign-out functionality
- Created documentation in README and .env.example
- Fixed tests for GitHub webhook handler
- Updated error handling in PR review integration

## Next Steps
- Test authentication flow end-to-end
- Add account management functionality
- Implement repository connection with the authenticated user's GitHub account
- Enhance the dashboard with real-time data from connected repositories

## Active Decisions
- Using GitHub OAuth exclusively as the authentication method
- Storing session information securely in cookies
- Using middleware to protect routes that require authentication
- Structuring the UI to display user information after authentication
- Implementing a clean separation between authenticated and public views

## Technical Considerations
- GitHub access tokens are being properly managed and stored
- User information (name, email, avatar) is retrieved from GitHub and displayed
- Session management uses secure cookies with CSRF protection
- Authentication failures are handled gracefully with a dedicated error page
- The AuthProvider component centralizes authentication state management
- Two user records may exist for the same GitHub user (one with UUID, one with GitHub ID)
- Repositories may be associated with the UUID user ID instead of GitHub ID
- Fix repositories page can update repository user associations 