import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, ExternalLink, Code, CheckCircle } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">iDocument</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="default" size="sm">
              <Link href="/auth/signin" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container">
          <section className="py-12 md:py-16 lg:py-20">
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                    Generate Great Documentation Automatically
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    AI-powered documentation that learns from your codebase and explains how everything works.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/auth/signin">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="#features">
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] aspect-video rounded-xl border overflow-hidden shadow-2xl animate-fade-in">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
                  <div className="relative p-4 bg-background/80 backdrop-blur-sm h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center mb-4">
                        <div className="flex space-x-2">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="ml-4 text-sm font-medium">Documentation.md</div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <pre className="text-xs">
                          <code>
                            {`# Authentication System

## Overview
The authentication system uses NextAuth.js with GitHub OAuth provider. 
User sessions are managed through JWT tokens with server-side validation.

## Main Components
- NextAuth.js for OAuth integration
- JWT token-based sessions
- Server-side session validation
- GitHub API integration for repository access

## Authentication Flow
1. User initiates sign in
2. GitHub OAuth flow is triggered
3. User authorizes application on GitHub
4. GitHub redirects back with authorization code
5. Server exchanges code for access token
6. User session is created with token and profile data
7. User is redirected to dashboard

## Protected Routes
All routes except the home page and authentication pages require 
authentication. The middleware checks for valid session tokens
before allowing access.`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 md:py-16" id="features">
            <div className="container space-y-12">
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Key Features
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Everything you need to document your code effectively
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                    <Code className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Code Analysis</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    AI-powered analysis of your code to understand structure, patterns, and functionality.
                  </p>
                </div>
                <div className="rounded-xl border p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Automated Documentation</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Generate comprehensive documentation without writing a word manually.
                  </p>
                </div>
                <div className="rounded-xl border p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                    <Github className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">GitHub Integration</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Connect directly to your GitHub repositories for seamless documentation updates.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 md:py-16 bg-muted/30">
            <div className="container space-y-8">
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How It Works
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Simple process, powerful results
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="relative rounded-xl border overflow-hidden shadow-xl animate-fade-in-left">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
                  <div className="relative p-8 bg-background/80 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold mb-4">Connect Your Repository</h4>
                    <ol className="space-y-4 text-gray-500 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
                        <div>
                          <p className="font-medium text-foreground">Sign in with GitHub</p>
                          <p className="text-sm">Authenticate securely with your GitHub account</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
                        <div>
                          <p className="font-medium text-foreground">Select repository</p>
                          <p className="text-sm">Choose which repository you want to document</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
                        <div>
                          <p className="font-medium text-foreground">Configure settings</p>
                          <p className="text-sm">Choose documentation style and customize options</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="relative rounded-xl border overflow-hidden shadow-xl animate-fade-in-right">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
                  <div className="relative p-8 bg-background/80 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold mb-4">Example Component Documentation</h4>
                    <div className="prose prose-sm max-w-none">
                      <h5 className="font-medium">Authentication Flow</h5>
                      <p>The authentication system uses NextAuth.js with GitHub OAuth provider. User sessions are managed through JWT tokens with server-side validation.</p>
                      <pre className="rounded-md bg-muted p-4 text-xs">
                        <code>
                          {`// Session validation middleware
export async function middleware(req) {
  const session = await getSession(req);
  if (!session && isProtectedRoute(req.url)) {
    return redirectToLogin(req);
  }
  return NextResponse.next();
}`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="border-t py-12 md:py-16 bg-muted/30">
        <div className="container flex flex-col items-center justify-between gap-8 md:flex-row md:gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">iDocument</span>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              Making code documentation effortless and automatic.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 md:items-end">
            <p className="text-center text-sm text-muted-foreground md:text-right">
              &copy; {new Date().getFullYear()} iDocument. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="https://github.com"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 