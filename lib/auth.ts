import NextAuth from "next-auth";
import GitHub, { GithubProfile } from "next-auth/providers/github";
import { db } from "@/lib/supabase/db";
import { users, accounts } from "@/lib/supabase/schema";
import { eq, and } from "drizzle-orm";

// Define auth configuration for Next.js 15 compatibility
export const { 
  handlers: { GET, POST },
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  
  session: {
    strategy: "jwt",
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  callbacks: {
    // Add token data during JWT creation
    async jwt({ token, account, profile }) {
      if (account?.provider === 'github' && profile) {
        // Cast to GitHub profile to access properties
        const githubProfile = profile as GithubProfile;
        
        // Store GitHub information in the token
        token.gitHubId = githubProfile.id;
        token.gitHubLogin = githubProfile.login;
        token.sub = String(githubProfile.id); // Use GitHub ID consistently as user ID
        token.accessToken = account.access_token;
        
        // Try to save GitHub account information to database
        try {
          await saveGitHubAccount(
            token.sub,
            account.access_token!,
            account.refresh_token,
            account.expires_at ? account.expires_at * 1000 : undefined
          );
        } catch (error) {
          console.error("Auth error saving GitHub account:", error);
        }
      }
      return token;
    },

    // Create session from token data
    async session({ session, token }) {
      if (token.sub && session.user) {
        // Add the GitHub ID as the user ID to the session
        session.user.id = token.sub;
        
        // Add access token if available
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        
        // Try to check user in database but don't block auth if it fails
        try {
          await checkOrCreateUser(token);
        } catch (error) {
          console.error("Database error:", error);
        }
      }
      return session;
    },
  },
});

// Helper function to save GitHub account info
async function saveGitHubAccount(
  userId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number
) {
  try {
    // Check if account exists
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.provider, "github")
        )
      )
      .limit(1);
    
    if (existingAccount.length > 0) {
      // Update existing account
      await db
        .update(accounts)
        .set({
          accessToken,
          refreshToken,
          expiresAt: expiresAt ? Math.floor(expiresAt / 1000) : undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accounts.userId, userId),
            eq(accounts.provider, "github")
          )
        );
    } else {
      // Create new account
      await db
        .insert(accounts)
        .values({
          userId,
          type: "oauth",
          provider: "github",
          providerAccountId: userId,
          accessToken,
          refreshToken,
          expiresAt: expiresAt ? Math.floor(expiresAt / 1000) : undefined,
          tokenType: "bearer",
          scope: "read:user,user:email,repo",
        });
    }
  } catch (error) {
    console.error("Database error saving account:", error);
    throw error;
  }
}

// Check if a user exists in the database or create them
async function checkOrCreateUser(token: any) {
  try {
    const userId = token.sub.toString();
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (existingUser.length === 0) {
      // Create the user if they don't exist
      await db.insert(users).values({
        id: userId,
        name: token.name,
        email: token.email,
        image: token.picture,
        gitHubId: token.gitHubId,
        gitHubLogin: token.gitHubLogin,
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error checking/creating user:", error);
    return false;
  }
}

// Type definitions
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
} 