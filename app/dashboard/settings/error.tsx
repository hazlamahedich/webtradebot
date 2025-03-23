"use client";

import { Button } from "@/components/ui/button";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto py-6">
      <div className="bg-white dark:bg-slate-800 rounded-md border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="mb-4">We encountered an error loading the settings page.</p>
        <div className="flex gap-4">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
} 