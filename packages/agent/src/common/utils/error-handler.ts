/**
 * Error Handler
 * 
 * Centralized error handling and logging utility
 * Provides consistent error handling across all agents
 */

// Standardized error types
export enum ErrorType {
  // General errors
  GENERAL = 'general',
  CONFIG = 'config',
  
  // API errors
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  API_RATE_LIMIT = 'api_rate_limit',
  
  // LLM errors
  LLM_REQUEST = 'llm_request',
  LLM_RESPONSE = 'llm_response',
  LLM_PARSING = 'llm_parsing',
  
  // Blockchain errors
  BLOCKCHAIN_REQUEST = 'blockchain_request',
  BLOCKCHAIN_TRANSACTION = 'blockchain_transaction',
  BLOCKCHAIN_RECEIPT = 'blockchain_receipt',
  
  // Agent-specific errors
  AGENT_STATE = 'agent_state',
  AGENT_FLOW = 'agent_flow',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_TIMEOUT = 'resource_timeout',
}

// Standardized error severity
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Error context interface
export interface ErrorContext {
  [key: string]: any;
}

// Standardized error structure
export interface StandardError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  timestamp: number;
  handled: boolean;
}

// Error collector
const errorLog: StandardError[] = [];
const MAX_ERROR_LOG_SIZE = 100;

// Error handlers registry
type ErrorHandler = (error: StandardError) => void;
const errorHandlers: ErrorHandler[] = [];

/**
 * Process an error through the standardized error pipeline
 */
export function handleError(
  error: Error | string,
  options: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    context?: ErrorContext;
    handled?: boolean;
  } = {}
): StandardError {
  const {
    type = ErrorType.GENERAL,
    severity = ErrorSeverity.ERROR,
    context = {},
    handled = false,
  } = options;
  
  // Create standardized error
  const standardError: StandardError = {
    type,
    severity,
    message: typeof error === 'string' ? error : error.message,
    originalError: typeof error === 'string' ? undefined : error,
    context,
    timestamp: Date.now(),
    handled,
  };
  
  // Log the error appropriately based on severity
  logError(standardError);
  
  // Add to error log, maintaining max size
  errorLog.unshift(standardError);
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.pop();
  }
  
  // Notify all registered error handlers
  for (const handler of errorHandlers) {
    try {
      handler(standardError);
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError);
    }
  }
  
  return standardError;
}

/**
 * Get recent errors
 */
export function getRecentErrors(
  limit: number = 10,
  filter?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    minSeverity?: ErrorSeverity;
  }
): StandardError[] {
  let filtered = [...errorLog];
  
  // Apply filters if provided
  if (filter) {
    if (filter.type) {
      filtered = filtered.filter(error => error.type === filter.type);
    }
    
    if (filter.severity) {
      filtered = filtered.filter(error => error.severity === filter.severity);
    }
    
    if (filter.minSeverity) {
      const severities = Object.values(ErrorSeverity);
      const minIndex = severities.indexOf(filter.minSeverity);
      filtered = filtered.filter(error => {
        const errorIndex = severities.indexOf(error.severity);
        return errorIndex >= minIndex;
      });
    }
  }
  
  // Return limited results
  return filtered.slice(0, limit);
}

/**
 * Register a custom error handler
 */
export function registerErrorHandler(handler: ErrorHandler): void {
  errorHandlers.push(handler);
}

/**
 * Unregister a custom error handler
 */
export function unregisterErrorHandler(handler: ErrorHandler): void {
  const index = errorHandlers.indexOf(handler);
  if (index !== -1) {
    errorHandlers.splice(index, 1);
  }
}

/**
 * Log an error based on severity
 */
function logError(error: StandardError): void {
  const prefix = `[${error.type}][${error.severity}]`;
  
  switch (error.severity) {
    case ErrorSeverity.DEBUG:
      console.debug(`${prefix} ${error.message}`, error.context);
      break;
    case ErrorSeverity.INFO:
      console.info(`${prefix} ${error.message}`, error.context);
      break;
    case ErrorSeverity.WARNING:
      console.warn(`${prefix} ${error.message}`, error.context);
      break;
    case ErrorSeverity.ERROR:
      console.error(`${prefix} ${error.message}`, error.context);
      if (error.originalError) {
        console.error('Original error:', error.originalError);
      }
      break;
    case ErrorSeverity.CRITICAL:
      console.error(`${prefix} CRITICAL: ${error.message}`, error.context);
      if (error.originalError) {
        console.error('Original error:', error.originalError);
      }
      // You could add additional alert mechanisms here for critical errors
      break;
  }
}

/**
 * Create a specialized error handler for a specific agent
 */
export function createAgentErrorHandler(agentName: string) {
  return {
    handleError: (
      error: Error | string,
      options: {
        type?: ErrorType;
        severity?: ErrorSeverity;
        context?: ErrorContext;
        handled?: boolean;
      } = {}
    ): StandardError => {
      // Add agent name to context
      const context = { 
        ...options.context,
        agentName,
      };
      
      return handleError(error, {
        ...options,
        context,
      });
    },
    
    getRecentErrors: (
      limit: number = 10,
      filter?: {
        type?: ErrorType;
        severity?: ErrorSeverity;
        minSeverity?: ErrorSeverity;
      }
    ): StandardError[] => {
      // Filter errors for this agent
      return getRecentErrors(limit, filter).filter(
        error => error.context?.agentName === agentName
      );
    },
  };
}
