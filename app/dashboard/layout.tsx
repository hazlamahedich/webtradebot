"use client";

import React from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-slate-100 dark:bg-slate-800 border-r h-screen flex flex-col">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="text-xl font-bold">
            iDocument
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div className="py-2">
            <Link href="/dashboard" className="flex gap-2 hover:text-blue-600">
              Dashboard
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/reviews" className="flex gap-2 hover:text-blue-600">
              Reviews
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/repositories" className="flex gap-2 hover:text-blue-600">
              Repositories
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/analytics" className="flex gap-2 hover:text-blue-600">
              Analytics
            </Link>
          </div>
          <div className="py-2">
            <Link href="/documentation" className="flex gap-2 hover:text-blue-600">
              Documentation
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/serverless-test" className="flex gap-2 hover:text-blue-600">
              Serverless Test
            </Link>
          </div>
          <div className="py-2">
            <Link href="/dashboard/settings" className="flex gap-2 hover:text-blue-600">
              Settings
            </Link>
          </div>
        </nav>
      </div>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
} 