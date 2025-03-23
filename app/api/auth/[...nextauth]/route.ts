import { handlers } from "@/lib/auth";

// Export the Next.js API route handlers from NextAuth
export const { GET, POST } = handlers;

// Explicitly mark this route as not using Edge Runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 