"use client";

import React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, FileText, Settings, Github, BarChart } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    
    const nameParts = session.user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-slate-100 dark:bg-slate-800 border-r h-screen flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold">
            iDocument
          </Link>
        </div>
        
        {/* User info section */}
        {session?.user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-4 space-y-1">
          <div className="py-2">
            <Link href="/dashboard" className="flex items-center gap-2 hover:text-blue-600">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/reviews" className="flex items-center gap-2 hover:text-blue-600">
              <FileText className="h-4 w-4" />
              Reviews
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/repositories" className="flex items-center gap-2 hover:text-blue-600">
              <Github className="h-4 w-4" />
              Repositories
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/analytics" className="flex items-center gap-2 hover:text-blue-600">
              <BarChart className="h-4 w-4" />
              Analytics
            </Link>
          </div>
          <div className="py-2">
            <Link href="/documentation" className="flex items-center gap-2 hover:text-blue-600">
              <FileText className="h-4 w-4" />
              Documentation
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/settings" className="flex items-center gap-2 hover:text-blue-600">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
} 