"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthDebugPage() {
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getPackageInfo() {
      try {
        // Try to import package.json to get versions
        setPackageInfo({
          nextjs: process.env.NEXT_PUBLIC_VERSION || "unknown",
          nextauth: "Check package.json file",
          node: process.version,
        });
      } catch (err) {
        console.error("Error loading package info:", err);
        setError("Failed to load package information");
      } finally {
        setLoading(false);
      }
    }

    getPackageInfo();
  }, []);

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Auth Diagnostics</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Package Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="space-y-2">
              <div><strong>Next.js Version:</strong> {packageInfo.nextjs}</div>
              <div><strong>NextAuth Version:</strong> {packageInfo.nextauth}</div>
              <div><strong>Node.js Version:</strong> {packageInfo.node}</div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>GITHUB_ID exists:</strong> {process.env.NEXT_PUBLIC_GITHUB_ID_EXISTS ? "Yes" : "No"}</div>
            <div><strong>GITHUB_SECRET exists:</strong> {process.env.NEXT_PUBLIC_GITHUB_SECRET_EXISTS ? "Yes" : "No"}</div>
            <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Auth Error Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">The error you're seeing is likely because:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>There's a version mismatch between Next.js and NextAuth</li>
            <li>The NextAuth configuration might be using features not available in the installed version</li>
            <li>The Function.prototype.apply error usually indicates a NextAuth type mismatch</li>
          </ul>
          
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="font-semibold">Recommended Fix:</p>
            <ol className="list-decimal pl-5 space-y-2 mt-2">
              <li>Check package.json for next-auth version (should be compatible with Next.js 15.x)</li>
              <li>Run "npm install next-auth@latest" to update NextAuth</li>
              <li>Restart the server after updating</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 