import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { createClient } from "@/lib/supabase/client";
import { Session } from "next-auth";

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
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
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

// Supabase user session management
export const updateUserSession = async (userId: string, sessionData: any) => {
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
    return true;
  } catch (error) {
    console.error("Error updating user session:", error);
    return false;
  }
}; 