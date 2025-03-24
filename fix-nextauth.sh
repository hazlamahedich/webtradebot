#!/bin/bash

# Stop any running Next.js server
echo "Stopping any running Next.js server..."
pkill -f "next dev" || true

# Install a stable version of next-auth
echo "Installing next-auth v4.24.6 (stable version)..."
npm install next-auth@4.24.6

# Update the NextAuth implementation to be compatible with v4
echo "Updating NextAuth implementation..."
cat > app/api/auth/[...nextauth]/route.ts << 'EOL'
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const dynamic = 'force-dynamic';

// This is a v4 compatible implementation
const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      // @ts-ignore
      session.accessToken = token.accessToken;
      return session;
    }
  }
});

export { handler as GET, handler as POST };
EOL

echo "NextAuth fix completed. Please restart your server with 'npm run dev'" 