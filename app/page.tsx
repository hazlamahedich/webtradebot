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
          <nav className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm font-medium hover:text-primary transition-colors">
              Documentation
            </Link>
            <Link href="/auth/signin" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <ThemeToggle />
            <Link href="/auth/signin">
              <Button variant="ghost" className="hover:bg-primary/10">Sign In</Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="relative group overflow-hidden shadow-lg">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 group-hover:from-purple-600 group-hover:to-indigo-500 transition-all duration-500"></span>
                <span className="relative flex items-center">
                  Get Started <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center gap-8 pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm">
              <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
              Now in Public Beta
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              AI-Powered Code Documentation
            </h1>
            <p className="max-w-[42rem] text-muted-foreground sm:text-xl md:text-2xl animate-fade-in animate-delay-100">
              Automatically analyze code, generate comprehensive documentation, and 
              explain complex implementations in plain English.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 animate-fade-in animate-delay-200">
              <Link href="/auth/signin">
                <Button size="lg" className="h-12 px-8 relative group overflow-hidden shadow-lg">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 group-hover:from-purple-600 group-hover:to-indigo-500 transition-all duration-500"></span>
                  <span className="relative flex items-center font-semibold">
                    Get Started with GitHub <Github className="ml-2 h-5 w-5" />
                  </span>
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="h-12 px-8 border-2 hover:bg-secondary/50">
                  <span className="flex items-center font-semibold">
                    Live Demo <ExternalLink className="ml-2 h-4 w-4" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative mx-auto mt-10 w-full max-w-4xl rounded-xl border border-border shadow-2xl shadow-black/5 animate-fade-in animate-delay-300">
            <div className="rounded-t-xl bg-muted p-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="relative bg-black rounded-b-xl">
              <div className="overflow-hidden rounded-b-xl">
                <div className="bg-gray-900 p-6 text-sm text-green-400 font-mono overflow-x-auto">
                  <pre className="typing-effect">
                    <code>
                      <span className="text-blue-400">const</span> <span className="text-purple-400">generateDocs</span> = <span className="text-yellow-400">async</span> (repository) =&gt; {"{"}
                      <br/>  <span className="text-blue-400">const</span> code = <span className="text-purple-400">await</span> repository.getCode();
                      <br/>  <span className="text-blue-400">const</span> analysis = <span className="text-purple-400">await</span> AI.analyze(code);
                      <br/>
                      <br/>  <span className="text-green-400">// Generate comprehensive documentation</span>
                      <br/>  <span className="text-blue-400">return</span> {"{"}
                      <br/>    architecture: analysis.systemArchitecture,
                      <br/>    components: analysis.componentBreakdown,
                      <br/>    workflows: analysis.userFlows,
                      <br/>    api: analysis.endpointDocumentation
                      <br/>  {"}"};
                      <br/>{"}"};
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-secondary/50 py-16 md:py-24">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose iDocument</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center p-6 rounded-xl bg-background shadow-lg animate-fade-in-left">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Analysis</h3>
                <p className="text-muted-foreground text-center">
                  Advanced AI models understand your code at a semantic level to generate
                  meaningful documentation.
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl bg-background shadow-lg animate-fade-in animate-delay-100">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Human-Readable Docs</h3>
                <p className="text-muted-foreground text-center">
                  Complex code explained in clear, natural language that
                  anyone on your team can understand.
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl bg-background shadow-lg animate-fade-in-right">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Github className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">GitHub Integration</h3>
                <p className="text-muted-foreground text-center">
                  Seamlessly connects with your repositories for instant
                  documentation generation and updates.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-left">
              <h2 className="text-3xl font-bold mb-6">Documentation That Lives With Your Code</h2>
              <p className="text-muted-foreground mb-8">
                iDocument automatically updates when your code changes, ensuring your
                documentation is always in sync with your implementation.
              </p>
              <ul className="space-y-4">
                {[
                  "Architecture diagrams and system overviews",
                  "Component breakdowns with detailed explanations",
                  "API documentation with example usage",
                  "User flow documentation with sequence diagrams"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
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
        </section>
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