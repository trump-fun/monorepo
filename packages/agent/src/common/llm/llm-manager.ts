/**
 * LLM Manager
 * 
 * Centralized utility for working with Language Models across different agents.
 * Provides common functions for:
 * - Optimized prompt construction
 * - Context window management
 * - Response caching
 * - Error handling with retries
 * - Automatic model selection based on task complexity
 */

import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { config } from '../../config';

// Simple in-memory cache
interface CacheEntry {
  response: string;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Calculate a stable hash for a prompt to use as cache key
 */
function calculatePromptHash(prompt: string): string {
  // Simple hash function for strings
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Intelligently selects the most appropriate model based on task complexity
 */
function selectModelForTask(task: string, complexity: 'low' | 'medium' | 'high'): 'small_llm' | 'cheap_large_llm' | 'large_llm' {
  // Log the task and complexity for debugging
  console.log(`Model selection for task: ${task} (complexity: ${complexity})`);
  
  // Simple rules for model selection
  if (complexity === 'low') {
    return 'small_llm';
  } else if (complexity === 'medium') {
    return 'cheap_large_llm';
  } else {
    return 'large_llm';
  }
}

/**
 * Enhances a system prompt with relevant context and instructions
 */
function enhanceSystemPrompt(originalPrompt: string): string {
  // Add common instructions and context to all system prompts
  return `${originalPrompt}

IMPORTANT GUIDELINES:
- Be clear, concise, and factual in your responses
- Avoid speculative or unverifiable claims
- Indicate your level of confidence when appropriate
- Format structured data consistently
- Respect privacy and ethical considerations`;
}

/**
 * Main interface for interacting with language models
 * Handles caching, retries, and error handling
 */
export async function queryLLM(
  systemPrompt: string,
  userQuery: string,
  options: {
    complexity?: 'low' | 'medium' | 'high';
    modelOverride?: 'small_llm' | 'cheap_large_llm' | 'large_llm';
    temperature?: number;
    maxTokens?: number;
    bypassCache?: boolean;
    taskName?: string;
    maxRetries?: number;
  } = {}
): Promise<string> {
  const {
    complexity = 'medium',
    modelOverride,
    temperature = 0.7,
    maxTokens,
    bypassCache = false,
    taskName = 'General Query',
    maxRetries = 2,
  } = options;
  
  // Enhance the system prompt
  const enhancedSystemPrompt = enhanceSystemPrompt(systemPrompt);
  
  // Create a cache key from the prompt and parameters
  const promptHash = calculatePromptHash(enhancedSystemPrompt + userQuery + JSON.stringify({ 
    temperature, 
    maxTokens 
  }));
  
  // Check cache first unless bypassing
  if (!bypassCache) {
    const cached = responseCache.get(promptHash);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached LLM response for: ${taskName}`);
      return cached.response;
    }
  }
  
  // Select the appropriate model
  const modelKey = modelOverride || selectModelForTask(taskName, complexity);
  const model = config[modelKey];
  
  if (!model) {
    throw new Error(`Model ${modelKey} is not configured`);
  }
  
  console.log(`Using ${modelKey} for task: ${taskName}`);
  
  // Set up the messages
  const messages: BaseMessage[] = [
    new SystemMessage(enhancedSystemPrompt),
    new HumanMessage(userQuery),
  ];
  
  let lastError: Error | null = null;
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      if (retry > 0) {
        console.log(`LLM retry ${retry} for task: ${taskName}`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retry)));
      }
      
      // Use model-specific parameters when available
      const modelParams: any = {};
      if (maxTokens) {
        modelParams.maxTokens = maxTokens;
      }
      
      // Invoke the model
      const response = await model.invoke(messages, {
        temperature,
        ...modelParams,
      });
      
      // Extract the content from the response
      const content = response.content as string;
      
      // Cache the response
      responseCache.set(promptHash, { response: content, timestamp: Date.now() });
      
      return content;
    } catch (error: any) {
      console.error(`LLM error (retry ${retry}/${maxRetries}):`, error.message);
      lastError = error;
    }
  }
  
  throw lastError || new Error(`Unknown error with LLM for task: ${taskName}`);
}

/**
 * Wrapper for structured LLM responses
 * Formats the response according to the expected schema
 */
export async function queryStructuredLLM<T>(
  systemPrompt: string,
  userQuery: string,
  outputSchema: any,
  options: {
    complexity?: 'low' | 'medium' | 'high';
    modelOverride?: 'small_llm' | 'cheap_large_llm' | 'large_llm';
    temperature?: number;
    bypassCache?: boolean;
    taskName?: string;
    defaultValue?: T;
  } = {}
): Promise<T> {
  const {
    complexity = 'medium',
    modelOverride,
    temperature = 0.7,
    bypassCache = false,
    taskName = 'Structured Query',
    defaultValue,
  } = options;
  
  try {
    // Add schema instructions to the system prompt
    const schemaPrompt = `${systemPrompt}

OUTPUT FORMAT:
You must return a valid JSON object matching this schema:
${JSON.stringify(outputSchema, null, 2)}

Return ONLY the JSON object without any additional text.`;
    
    // Query the LLM
    const response = await queryLLM(schemaPrompt, userQuery, {
      complexity,
      modelOverride,
      temperature,
      bypassCache,
      taskName,
    });
    
    // Extract and parse the JSON response
    let jsonResponse: T;
    try {
      // Find JSON object in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      jsonResponse = JSON.parse(jsonMatch[0]) as T;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw response:', response);
      
      if (defaultValue !== undefined) {
        console.log('Using default value');
        return defaultValue;
      }
      throw parseError;
    }
    
    return jsonResponse;
  } catch (error) {
    console.error('Error in structured LLM query:', error);
    
    if (defaultValue !== undefined) {
      console.log('Using default value due to error');
      return defaultValue;
    }
    throw error;
  }
}

/**
 * Clear the response cache
 */
export function clearResponseCache(): void {
  responseCache.clear();
  console.log('LLM response cache cleared');
}

/**
 * Get cache statistics
 */
export function getResponseCacheStats(): { size: number; averageAge: number } {
  let totalAge = 0;
  const now = Date.now();
  
  responseCache.forEach(entry => {
    totalAge += now - entry.timestamp;
  });
  
  return {
    size: responseCache.size,
    averageAge: responseCache.size > 0 ? totalAge / responseCache.size : 0,
  };
}
