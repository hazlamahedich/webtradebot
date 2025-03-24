import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/supabase/db";
import { users, accounts } from "@/lib/supabase/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// Main NextAuth configuration
const handler = NextAuth({
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Add GitHub data to the token when signing in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.githubId = profile.id;
        token.githubLogin = profile.login;
        
        // Save GitHub account data to database
        try {
          await saveGitHubAccount(
            token.sub!,
            account.access_token!,
            account.refresh_token,
            account.expires_at ? account.expires_at * 1000 : undefined
          );
        } catch (error) {
          console.error("Error saving GitHub account:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID and GitHub access token to the session
      if (session.user) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken as string;
        
        // Save or update user in database
        try {
          await saveUser(
            token.sub!,
            session.user.name || "",
            session.user.email || "",
            session.user.image || "",
            token.githubId as number,
            token.githubLogin as string
          );
        } catch (error) {
          console.error("Error saving user:", error);
        }
      }
      return session;
    },
  },
});

// Helper function to save GitHub account data
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

// Helper function to save or update user
async function saveUser(
  id: string,
  name: string,
  email: string,
  image: string,
  githubId: number,
  githubLogin: string
) {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({
          name,
          email,
          image,
          gitHubId: githubId,
          gitHubLogin: githubLogin,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
    } else {
      // Create new user
      await db
        .insert(users)
        .values({
          id,
          name,
          email,
          image,
          gitHubId: githubId,
          gitHubLogin: githubLogin,
        });
    }
  } catch (error) {
    console.error("Database error saving user:", error);
    throw error;
  }
}

// Export NextAuth API handler
export { handler as GET, handler as POST };

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
  
  interface Profile {
    id: number;
    login: string;
  }
  
  interface JWT {
    accessToken?: string;
    githubId?: number;
    githubLogin?: string;
  }
} 