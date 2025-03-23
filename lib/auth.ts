import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { createClient } from "@/lib/supabase/client";
import { Session } from "next-auth";
import { db } from "@/lib/supabase/db";
import { users, accounts, repositories } from "@/lib/supabase/schema";
import { eq, sql } from "drizzle-orm";

// Extend the Session type to include accessToken
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
      console.log('Auth - Session callback - token.sub:', token.sub);
      console.log('Auth - Session callback - session before:', JSON.stringify(session, null, 2));
      
      if (token.sub && session.user) {
        // Use GitHub provider account ID as the consistent user ID 
        // This ensures the same user ID across sessions
        session.user.id = token.sub;
        
        // Verify if user exists in database
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.id, token.sub))
          .limit(1);
        
        console.log('Auth - User in database:', dbUser.length ? 'Yes' : 'No');
        if (dbUser.length) {
          console.log('Auth - Database user ID:', dbUser[0].id);
          
          // Check for repositories associated with UUID format IDs for this GitHub user
          await migrateUserRepositories(dbUser[0].name, token.sub);
        } else {
          // Create user if not exists
          console.log('Auth - Creating new user with ID:', token.sub);
          try {
            await db.insert(users).values({
              id: token.sub,
              name: session.user.name || '',
              email: session.user.email || '',
              image: session.user.image || null
            });
            console.log('Auth - User created successfully');
            
            // Also check for repositories to migrate
            if (session.user.name) {
              await migrateUserRepositories(session.user.name, token.sub);
            }
          } catch (error) {
            console.error('Auth - Error creating user:', error);
          }
        }
      }
      
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      
      console.log('Auth - Session callback - session after:', JSON.stringify(session, null, 2));
      return session;
    },
    async jwt({ token, account, profile, user }) {
      console.log('Auth - JWT callback - token before:', JSON.stringify(token, null, 2));
      
      if (account && profile) {
        console.log('Auth - JWT callback - account provider:', account.provider);
        console.log('Auth - JWT callback - GitHub user ID:', profile.id);
        
        // Use GitHub ID consistently for the user ID
        if (profile.id) {
          token.sub = profile.id as string;
        }
        
        token.accessToken = account.access_token;
        
        // Save the GitHub account information in the database
        try {
          console.log('Auth - Saving GitHub account information');
          
          // Check if account already exists
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(
              sql`${accounts.provider} = ${account.provider} AND ${accounts.providerAccountId} = ${account.providerAccountId}`
            )
            .limit(1);
            
          if (existingAccount.length === 0) {
            try {
              // Insert new account
              await db.execute(sql`
                INSERT INTO accounts (
                  user_id, 
                  type, 
                  provider, 
                  provider_account_id, 
                  refresh_token, 
                  access_token, 
                  expires_at, 
                  token_type, 
                  scope, 
                  id_token, 
                  session_state
                ) VALUES (
                  ${token.sub}, 
                  ${account.type}, 
                  ${account.provider}, 
                  ${account.providerAccountId}, 
                  ${account.refresh_token || null}, 
                  ${account.access_token || null}, 
                  ${account.expires_at || null}, 
                  ${account.token_type || null}, 
                  ${account.scope || null}, 
                  ${account.id_token || null}, 
                  ${account.session_state || null}
                )
              `);
              console.log('Auth - GitHub account information saved successfully');
            } catch (error) {
              console.error('Auth - Error executing SQL to save account:', error);
            }
          } else {
            try {
              // Update existing account
              await db.execute(sql`
                UPDATE accounts 
                SET 
                  access_token = ${account.access_token || null}, 
                  refresh_token = ${account.refresh_token || null}, 
                  expires_at = ${account.expires_at || null}
                WHERE 
                  provider = ${account.provider} AND 
                  provider_account_id = ${account.providerAccountId}
              `);
              console.log('Auth - GitHub account information updated successfully');
            } catch (error) {
              console.error('Auth - Error executing SQL to update account:', error);
            }
          }
        } catch (error) {
          console.error('Auth - Error saving GitHub account information:', error);
        }
      }
      
      console.log('Auth - JWT callback - token after:', JSON.stringify(token, null, 2));
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
});

// Function to migrate repositories from UUID to GitHub ID
async function migrateUserRepositories(username: string, githubId: string) {
  try {
    console.log(`Auth - Checking for repositories to migrate for user ${username} (GitHub ID: ${githubId})`);
    
    // Find all repositories created by this user's GitHub username but linked to a different user ID
    const reposToMigrate = await db
      .select()
      .from(repositories)
      .where(
        sql`LOWER(${repositories.owner}) = LOWER(${username}) AND ${repositories.userId} != ${githubId}`
      );
      
    if (reposToMigrate.length > 0) {
      console.log(`Auth - Found ${reposToMigrate.length} repositories to migrate to GitHub ID ${githubId}`);
      
      // Update all repositories to use the GitHub ID
      for (const repo of reposToMigrate) {
        console.log(`Auth - Migrating repository ${repo.fullName} from user ID ${repo.userId} to ${githubId}`);
        
        await db
          .update(repositories)
          .set({ userId: githubId })
          .where(eq(repositories.id, repo.id));
      }
      
      console.log(`Auth - Successfully migrated ${reposToMigrate.length} repositories to GitHub ID ${githubId}`);
    } else {
      console.log(`Auth - No repositories found to migrate for user ${username}`);
    }
  } catch (error) {
    console.error('Auth - Error migrating user repositories:', error);
  }
}

// Supabase user session management
export const updateUserSession = async (userId: string, sessionData: any) => {
  console.log('Auth - Updating user session for ID:', userId);
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from("user_sessions")
      .upsert({
        user_id: userId,
        session_data: sessionData,
        last_updated: new Date().toISOString(),
      })
      .select();
      
    if (error) throw error;
    console.log('Auth - User session updated successfully');
    return true;
  } catch (error) {
    console.error("Error updating user session:", error);
    return false;
  }
}; 