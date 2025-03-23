import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChainValues } from '@langchain/core/utils/types';
import { BaseMessage } from '@langchain/core/messages';
import OpenAI from "openai";
import { db } from "@/lib/supabase/db";
import { llmProviders, llmModels, llmUsage } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

// Import litellm with require for compatibility
const litellm = require('litellm');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache for LLM configurations to avoid repeated DB calls
let cachedConfigurations: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface LLMOptions {
  modelName?: string;
  provider?: string; 
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  callbacks?: any[];
}

interface UsageLog {
  configurationId: string;
  userId?: string;
  feature: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCost: number;
  startTime: Date;
  endTime?: Date;
  success: boolean;
  metadata?: any;
}

interface ModelUsage {
  model: string;
  provider: string;
  totalTokens: number;
  totalCost: number;
  requests: number;
}

interface FeatureUsage {
  feature: string;
  totalTokens: number;
  totalCost: number;
  requests: number;
}

interface OpenAIInitOptions {
  apiKey: string;
  baseURL?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  feature?: string;
  userId?: string;
}

interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
  model: string;
}

/**
 * Get all LLM configurations from the database
 */
export async function getLLMConfigurations(forceRefresh = false) {
  // Check cache first
  if (!forceRefresh && cachedConfigurations && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return cachedConfigurations;
  }

  const { data, error } = await supabase
    .from('llm_configurations')
    .select('*')
    .order('provider', { ascending: true })
    .order('displayName', { ascending: true });

  if (error) {
    console.error('Error fetching LLM configurations:', error);
    throw new Error('Failed to fetch LLM configurations');
  }

  cachedConfigurations = data;
  cacheTimestamp = Date.now();
  return data;
}

/**
 * Get the default LLM configuration
 */
export async function getDefaultLLMConfiguration() {
  const { data, error } = await supabase
    .from('llm_configurations')
    .select('*')
    .eq('isDefault', true)
    .single();

  if (error) {
    // If no default is found, use OpenAI with environment variable
    return {
      id: 'env-default',
      provider: 'openai',
      modelName: 'gpt-4o',
      displayName: 'OpenAI GPT-4o (Default)',
      apiKey: process.env.OPENAI_API_KEY,
      isActive: true,
      isDefault: true,
    };
  }

  return data;
}

/**
 * Save usage log to database
 */
export async function logLLMUsage(log: UsageLog) {
  const { error } = await supabase
    .from('llm_usage_logs')
    .insert([log]);

  if (error) {
    console.error('Error logging LLM usage:', error);
  }
}

/**
 * Complete a prompt using LiteLLM with automatic logging
 */
export async function completeWithLogging(
  prompt: string | string[], 
  options: LLMOptions = {}, 
  userId?: string,
  feature = 'general'
) {
  const startTime = new Date();
  const config = await getDefaultLLMConfiguration();
  let response: any;
  let success = true;

  try {
    // Configure litellm
    const modelName = options.modelName || config.modelName;
    
    // Add API key and custom base URL if available
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    const customHeaders: Record<string, string> = {};
    const litellmOptions: any = {
      model: modelName,
      api_key: apiKey,
      temperature: options.temperature || 0.1,
      max_tokens: options.maxTokens || 4000,
    };
    
    if (config.apiUrl) {
      litellmOptions.api_base = config.apiUrl;
    }

    // Make the completion call
    response = await litellm.completion({
      ...litellmOptions,
      messages: typeof prompt === 'string' 
        ? [{ role: 'user', content: prompt }] 
        : prompt.map(p => ({ role: 'user', content: p })),
    });
  } catch (error) {
    console.error('LLM completion error:', error);
    success = false;
    throw error;
  } finally {
    // Log usage if we have a configurationId
    if (config.id && response?.usage) {
      const promptTokens = response.usage.prompt_tokens || 0;
      const completionTokens = response.usage.completion_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      
      // Calculate cost based on configuration rates
      const costPerInputToken = parseFloat(config.costPerInputToken || '0');
      const costPerOutputToken = parseFloat(config.costPerOutputToken || '0');
      const totalCost = (promptTokens * costPerInputToken) + (completionTokens * costPerOutputToken);

      await logLLMUsage({
        configurationId: config.id,
        userId,
        feature,
        promptTokens,
        completionTokens,
        totalTokens,
        totalCost,
        startTime,
        endTime: new Date(),
        success,
        metadata: {
          model: config.modelName,
          provider: config.provider,
        }
      });
    }
  }

  return response;
}

/**
 * Create a LangChain ChatModel using appropriate integration
 */
export async function createLangChainModel(options: LLMOptions = {}) {
  const config = await getDefaultLLMConfiguration();
  
  // Use environment default if no specific config
  if (config.provider === 'openai' && !config.apiUrl) {
    return new ChatOpenAI({
      modelName: options.modelName || config.modelName,
      temperature: options.temperature || 0.1,
      maxTokens: options.maxTokens || 4000,
      streaming: options.streaming,
      callbacks: options.callbacks,
    });
  }
  
  // For other providers or custom URLs, use ChatOpenAI with custom base URL
  return new ChatOpenAI({
    modelName: options.modelName || config.modelName,
    temperature: options.temperature || 0.1,
    maxTokens: options.maxTokens || 4000,
    streaming: options.streaming,
    callbacks: options.callbacks,
    openAIApiKey: config.apiKey || process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: config.apiUrl,
    }
  });
}

/**
 * Get LLM usage statistics by period (day, week, month)
 */
export async function getLLMUsageStats(period = 'day', userId?: string) {
  const now = new Date();
  let startDate;
  
  switch(period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'day':
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
  }

  let query = supabase
    .from('llm_usage_logs')
    .select(`
      id,
      configurationId,
      userId,
      feature,
      promptTokens,
      completionTokens,
      totalTokens,
      totalCost,
      startTime,
      endTime,
      success,
      llm_configurations(provider, modelName, displayName)
    `)
    .gte('startTime', startDate.toISOString());

  if (userId) {
    query = query.eq('userId', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching LLM usage stats:', error);
    throw new Error('Failed to fetch LLM usage statistics');
  }

  return data;
}

/**
 * Get aggregated LLM usage by model
 */
export async function getLLMUsageByModel(period = 'day'): Promise<ModelUsage[]> {
  const usageData = await getLLMUsageStats(period);
  
  // Group by model
  const modelUsage: Record<string, ModelUsage> = {};
  
  usageData.forEach(log => {
    const modelInfo = log.llm_configurations as any;
    if (!modelInfo) return;
    
    const modelName = modelInfo.displayName;
    
    if (!modelUsage[modelName]) {
      modelUsage[modelName] = {
        model: modelName,
        provider: modelInfo.provider,
        totalTokens: 0,
        totalCost: 0,
        requests: 0,
      };
    }
    
    modelUsage[modelName].totalTokens += log.totalTokens;
    modelUsage[modelName].totalCost += parseFloat(log.totalCost || '0');
    modelUsage[modelName].requests += 1;
  });
  
  return Object.values(modelUsage);
}

/**
 * Get aggregated LLM usage by feature
 */
export async function getLLMUsageByFeature(period = 'day'): Promise<FeatureUsage[]> {
  const usageData = await getLLMUsageStats(period);
  
  // Group by feature
  const featureUsage: Record<string, FeatureUsage> = {};
  
  usageData.forEach(log => {
    const feature = log.feature;
    
    if (!featureUsage[feature]) {
      featureUsage[feature] = {
        feature,
        totalTokens: 0,
        totalCost: 0,
        requests: 0,
      };
    }
    
    featureUsage[feature].totalTokens += log.totalTokens;
    featureUsage[feature].totalCost += parseFloat(log.totalCost || '0');
    featureUsage[feature].requests += 1;
  });
  
  return Object.values(featureUsage);
}

/**
 * LLM Provider to handle different model providers through LiteLLM
 */
export class LLMProvider {
  private openai: OpenAI | null = null;
  private providerConfig: {
    name: string;
    apiKey: string;
    apiBase?: string | null;
  } | null = null;

  constructor() {
    // Initialize with default configuration
    this.initializeDefault();
  }

  /**
   * Initialize the provider with default configuration from database
   */
  private async initializeDefault() {
    try {
      // Get default provider from database
      const defaultProvider = await db
        .select()
        .from(llmProviders)
        .where(eq(llmProviders.isDefault, true))
        .limit(1);

      if (defaultProvider.length > 0) {
        this.providerConfig = {
          name: defaultProvider[0].name,
          apiKey: defaultProvider[0].apiKey,
          apiBase: defaultProvider[0].apiBase,
        };

        // Initialize OpenAI with default config
        const options: OpenAIInitOptions = {
          apiKey: defaultProvider[0].apiKey,
        };

        if (defaultProvider[0].apiBase) {
          options.baseURL = defaultProvider[0].apiBase;
        }

        this.openai = new OpenAI(options);

        // Configure LiteLLM with the same settings
        litellm.setOpenAIKey(defaultProvider[0].apiKey);
        
        if (defaultProvider[0].apiBase) {
          // Set custom base URL for specific provider if needed
          litellm.setProviderBaseURL(defaultProvider[0].name.toLowerCase(), defaultProvider[0].apiBase);
        }
      } else {
        // Fallback to environment variables
        this.providerConfig = {
          name: "openai",
          apiKey: process.env.OPENAI_API_KEY || "",
        };
        
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Configure LiteLLM with the same settings
        litellm.setOpenAIKey(process.env.OPENAI_API_KEY || "");
      }
    } catch (error) {
      console.error("Failed to initialize default LLM provider:", error);
      // Fallback to environment variables
      this.providerConfig = {
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY || "",
      };
      
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Configure LiteLLM with the same settings
      litellm.setOpenAIKey(process.env.OPENAI_API_KEY || "");
    }
  }

  /**
   * Initialize with a specific provider
   */
  async initializeProvider(providerId: string) {
    try {
      const provider = await db
        .select()
        .from(llmProviders)
        .where(eq(llmProviders.id, providerId))
        .limit(1);

      if (provider.length > 0) {
        this.providerConfig = {
          name: provider[0].name,
          apiKey: provider[0].apiKey,
          apiBase: provider[0].apiBase,
        };

        // Initialize OpenAI with new config
        const options: OpenAIInitOptions = {
          apiKey: provider[0].apiKey,
        };

        if (provider[0].apiBase) {
          options.baseURL = provider[0].apiBase;
        }

        this.openai = new OpenAI(options);

        // Configure LiteLLM with the same settings
        litellm.setOpenAIKey(provider[0].apiKey);
        
        if (provider[0].apiBase) {
          // Set custom base URL for specific provider if needed
          litellm.setProviderBaseURL(provider[0].name.toLowerCase(), provider[0].apiBase);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to initialize provider:", error);
      return false;
    }
  }

  /**
   * Get default model for a specific task
   */
  async getDefaultModel(task: string = "generation"): Promise<string> {
    try {
      const defaultModel = await db
        .select()
        .from(llmModels)
        .where(eq(llmModels.isDefault, true))
        .limit(1);

      if (defaultModel.length > 0) {
        return defaultModel[0].modelId;
      }

      // Fallback models based on task
      if (task === "generation") {
        return "gpt-4o";
      } else if (task === "embedding") {
        return "text-embedding-3-large";
      }

      return "gpt-4o"; // Default fallback
    } catch (error) {
      console.error("Failed to get default model:", error);
      return "gpt-4o"; // Default fallback
    }
  }

  /**
   * Create chat completion using LiteLLM
   */
  async createChatCompletion({
    model,
    messages,
    temperature = 0.7,
    max_tokens,
    feature = "general",
    userId,
  }: ChatCompletionOptions): Promise<LLMResponse> {
    if (!this.providerConfig) {
      await this.initializeDefault();
    }

    // Determine the provider prefix if needed (for LiteLLM)
    let fullModelName = model;
    if (this.providerConfig && this.providerConfig.name !== "openai") {
      // For non-OpenAI providers, prefix the model with the provider name
      // Only if not already prefixed
      if (!model.includes("/")) {
        fullModelName = `${this.providerConfig.name}/${model}`;
      }
    }

    const startTime = Date.now();
    
    try {
      // Use LiteLLM for chat completion
      const completion = await litellm.completion({
        model: fullModelName,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
      });

      const duration = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || "";
      
      // Calculate cost based on usage
      const { prompt_tokens, completion_tokens, total_tokens } = completion.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };
      
      // Estimate cost based on tokens and model
      // This is a simple estimation, should be replaced with actual pricing data
      const cost = this.calculateCost(model, prompt_tokens, completion_tokens);
      
      // Record usage in database if userId is provided
      if (userId) {
        await this.recordUsage({
          userId,
          modelId: model,
          modelName: fullModelName,
          feature,
          promptTokens: prompt_tokens,
          completionTokens: completion_tokens,
          totalTokens: total_tokens,
          cost,
          duration,
        });
      }
      
      return {
        content,
        usage: {
          prompt_tokens,
          completion_tokens,
          total_tokens,
        },
        cost,
        model: fullModelName,
      };
    } catch (error) {
      console.error(`Error creating chat completion with ${fullModelName}:`, error);
      throw error;
    }
  }

  /**
   * Create embeddings using the specified model
   */
  async createEmbeddings(
    text: string | string[],
    model: string = "text-embedding-3-large"
  ) {
    if (!this.openai) {
      await this.initializeDefault();
    }

    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    try {
      const input = Array.isArray(text) ? text : [text];
      const response = await this.openai.embeddings.create({
        input,
        model,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating embeddings:", error);
      throw error;
    }
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Define pricing based on model
    const pricing: Record<string, { prompt: number; completion: number }> = {
      // OpenAI models
      "gpt-4o": { prompt: 0.000005, completion: 0.000015 },
      "gpt-4-turbo": { prompt: 0.00001, completion: 0.00003 },
      "gpt-4": { prompt: 0.00003, completion: 0.00006 },
      "gpt-3.5-turbo": { prompt: 0.0000015, completion: 0.000002 },
      "text-embedding-3-large": { prompt: 0.00000133, completion: 0 },
      "text-embedding-3-small": { prompt: 0.00000033, completion: 0 },
      
      // Default pricing (fallback)
      "default": { prompt: 0.000005, completion: 0.000015 },
    };
    
    // Get pricing for the model or use default
    const modelPricing = pricing[model] || pricing["default"];
    
    // Calculate cost
    const promptCost = promptTokens * modelPricing.prompt;
    const completionCost = completionTokens * modelPricing.completion;
    
    return parseFloat((promptCost + completionCost).toFixed(6));
  }

  /**
   * Record usage in database
   */
  private async recordUsage({
    userId,
    modelId,
    modelName,
    feature,
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    duration,
  }: {
    userId: string;
    modelId: string;
    modelName: string;
    feature: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    duration: number;
  }) {
    try {
      // Get provider ID if available
      let providerId = null;
      if (this.providerConfig) {
        const provider = await db
          .select()
          .from(llmProviders)
          .where(eq(llmProviders.name, this.providerConfig.name))
          .limit(1);
          
        if (provider.length > 0) {
          providerId = provider[0].id;
        }
      }
      
      // Record usage
      await db.insert(llmUsage).values({
        userId,
        modelId,
        modelName,
        providerId,
        feature,
        requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        totalTokens,
        cost,
        duration,
      });
    } catch (error) {
      console.error("Failed to record LLM usage:", error);
      // Don't throw error here to prevent blocking the main functionality
    }
  }
}

// Export singleton instance
export const llmProvider = new LLMProvider(); 