import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for caching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Cache service for optimizing AI processing
 */
export class AICache {
  private tableName: string;
  
  constructor(tableName = "ai_cache") {
    this.tableName = tableName;
  }
  
  /**
   * Get cached result by key
   */
  async get(key: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("value, created_at")
        .eq("key", key)
        .single();
        
      if (error || !data) {
        return null;
      }
      
      // Check if cache is expired (default 24 hours)
      const cacheTime = new Date(data.created_at);
      const now = new Date();
      const cacheAgeHours = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
      
      if (cacheAgeHours > 24) {
        // Cache expired, delete it
        await this.delete(key);
        return null;
      }
      
      return JSON.parse(data.value);
    } catch (error) {
      console.error("Cache retrieval error:", error);
      return null;
    }
  }
  
  /**
   * Set cache value by key
   */
  async set(key: string, value: any, ttlHours = 24): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .upsert({
          key,
          value: JSON.stringify(value),
          created_at: new Date().toISOString(),
          ttl: ttlHours
        });
        
      if (error) {
        console.error("Cache storage error:", error);
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }
  
  /**
   * Delete cache entry by key
   */
  async delete(key: string): Promise<void> {
    try {
      await supabase
        .from(this.tableName)
        .delete()
        .eq("key", key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }
  
  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await supabase
        .from(this.tableName)
        .delete()
        .neq("key", ""); // Delete all entries
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }
  
  /**
   * Get or set cache with callback
   */
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttlHours = 24): Promise<T> {
    const cachedValue = await this.get(key);
    if (cachedValue !== null) {
      return cachedValue as T;
    }
    
    const newValue = await callback();
    await this.set(key, newValue, ttlHours);
    return newValue;
  }
}

// Export singleton instance
export const aiCache = new AICache(); 