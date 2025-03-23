import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testServerlessOptimization } from "@/lib/serverless-optimization";

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const functionName = req.nextUrl.searchParams.get("function") || "default";
  const executionTime = parseInt(req.nextUrl.searchParams.get("time") || "1000", 10);
  const memoryLimit = parseInt(req.nextUrl.searchParams.get("memory") || "50", 10);
  
  // Example test function that simulates work
  const testFunction = {
    name: functionName,
    expectedExecutionTime: executionTime,
    expectedMemoryUsage: memoryLimit,
    run: async () => {
      // Simulate CPU work
      const startTime = Date.now();
      
      // Run until time limit is reached
      const workTime = Math.min(executionTime / 2, 1000); // Cap at 1 second for safety
      while (Date.now() - startTime < workTime) {
        // Busy wait to simulate CPU work
        Math.random() * Math.random();
      }
      
      // Simulate memory usage
      const arrays = [];
      const memUsage = Math.min(memoryLimit / 2, 20); // Cap at 20MB for safety
      
      for (let i = 0; i < memUsage; i++) {
        // Each array is roughly 1MB
        arrays.push(new Array(250000).fill(0));
      }
      
      return { completed: true };
    }
  };
  
  try {
    const result = await testServerlessOptimization(testFunction, session.user.id);
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Serverless test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
} 