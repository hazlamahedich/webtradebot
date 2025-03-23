import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

type ServerlessFunction = {
  name: string;
  run: () => Promise<any>;
  expectedMemoryUsage?: number; // in MB
  expectedExecutionTime?: number; // in ms
};

type MetricResult = {
  functionName: string;
  executionTimeMs: number;
  memoryUsageMb: number;
  status: "success" | "error";
  errorMessage?: string;
  requestId: string;
};

/**
 * Runs a function and records its performance metrics
 */
export async function measureServerlessFunction(
  func: ServerlessFunction, 
  userId?: string
): Promise<MetricResult> {
  const requestId = uuidv4();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const startTime = performance.now();
  
  let result: MetricResult = {
    functionName: func.name,
    executionTimeMs: 0,
    memoryUsageMb: 0,
    status: "success",
    requestId,
  };
  
  try {
    await func.run();
    result.status = "success";
  } catch (error) {
    result.status = "error";
    result.errorMessage = error instanceof Error ? error.message : String(error);
  } finally {
    result.executionTimeMs = Math.round(performance.now() - startTime);
    result.memoryUsageMb = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) - startMemory);
  }
  
  // Store metrics in Supabase for analysis
  if (userId) {
    try {
      const supabase = createClient();
      await supabase.from("serverless_metrics").insert({
        function_name: result.functionName,
        execution_time_ms: result.executionTimeMs,
        memory_usage_mb: result.memoryUsageMb,
        status: result.status,
        error_message: result.errorMessage,
        request_id: result.requestId,
        user_id: userId,
      });
    } catch (error) {
      console.error("Failed to record serverless metrics:", error);
    }
  }
  
  return result;
}

/**
 * Tests if a function meets performance requirements
 */
export function isPerformanceAcceptable(
  result: MetricResult, 
  expectedExecutionTime?: number,
  expectedMemoryUsage?: number
): { acceptable: boolean; reason?: string } {
  if (result.status === "error") {
    return { acceptable: false, reason: `Function failed with error: ${result.errorMessage}` };
  }
  
  if (expectedExecutionTime && result.executionTimeMs > expectedExecutionTime) {
    return { 
      acceptable: false, 
      reason: `Execution time (${result.executionTimeMs}ms) exceeds maximum (${expectedExecutionTime}ms)` 
    };
  }
  
  if (expectedMemoryUsage && result.memoryUsageMb > expectedMemoryUsage) {
    return { 
      acceptable: false, 
      reason: `Memory usage (${result.memoryUsageMb}MB) exceeds maximum (${expectedMemoryUsage}MB)` 
    };
  }
  
  return { acceptable: true };
}

/**
 * Run a comprehensive test on a serverless function with optimization feedback
 */
export async function testServerlessOptimization(
  func: ServerlessFunction,
  userId?: string
): Promise<{
  passed: boolean;
  metrics: MetricResult;
  feedback: string;
}> {
  const metrics = await measureServerlessFunction(func, userId);
  const performanceCheck = isPerformanceAcceptable(
    metrics, 
    func.expectedExecutionTime, 
    func.expectedMemoryUsage
  );
  
  let feedback = "";
  if (metrics.status === "error") {
    feedback = `Function failed: ${metrics.errorMessage}`;
  } else if (!performanceCheck.acceptable) {
    feedback = performanceCheck.reason || "Performance does not meet requirements";
  } else {
    feedback = `Function performed within acceptable limits: ${metrics.executionTimeMs}ms execution time, ${metrics.memoryUsageMb}MB memory usage.`;
  }
  
  return {
    passed: metrics.status === "success" && performanceCheck.acceptable,
    metrics,
    feedback,
  };
} 