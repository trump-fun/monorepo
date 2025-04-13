/**
 * Common Utilities Index
 * 
 * Central export point for all shared utilities used across agents.
 * This provides a standardized set of tools for content fetching, API interactions,
 * LLM integration, error handling, and more.
 */

// API Utilities
export * from './api/datura-api';

// LLM Utilities
export * from './llm/llm-manager';

// Fetch Utilities
export * from './fetch/content-fetcher';

// Blockchain Utilities
export * from './blockchain/contract-interface';

// Error Handling
export * from './utils/error-handler';

// Export utility functions
export const VERSION = '0.2.0';

/**
 * Creates configuration for an agent with predefined settings
 */
export function createAgentConfig(agentName: string, options?: {
  defaultMaxRetries?: number;
  defaultCacheExpiration?: number;
  errorLoggingLevel?: 'debug' | 'info' | 'warn' | 'error';
}) {
  return {
    name: agentName,
    version: VERSION,
    maxRetries: options?.defaultMaxRetries ?? 3,
    cacheExpiration: options?.defaultCacheExpiration ?? 3600, // 1 hour
    errorLoggingLevel: options?.errorLoggingLevel ?? 'warn',
  };
}
