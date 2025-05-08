import pino from 'pino';

// Configuration options that can be adjusted for different agents
const LOG_CONFIG = {
  // Default log settings
  default: {
    filePath: 'logs/agent.log',
    level: 'info',
  },

  // Bet grading agent settings
  betGrading: {
    filePath: 'logs/bet-grading-agent.log',
    level: 'info',
  },

  // Pool generation agent settings
  poolGeneration: {
    filePath: 'logs/pool-generation-agent.log',
    level: 'info',
  },

  // Log rotation settings - applied to all loggers
  rotation: {
    size: '1M', // Rotate when file reaches 1 MB
    keep: 50, // Keep 50 historical files
    mkdir: true, // Create logs directory if it doesn't exist
  },
};

/**
 * Creates a Pino logger instance with file rotation and optional console output
 * @param loggerName - Name of the logger (used to select configuration)
 * @returns A configured Pino logger instance
 */
export function createLogger(loggerName: 'default' | 'betGrading' | 'poolGeneration' = 'default') {
  const config = LOG_CONFIG[loggerName] || LOG_CONFIG.default;

  // Configure a rotating file stream
  const fileTransport = pino.transport({
    target: 'pino-roll',
    options: {
      file: config.filePath,
      size: LOG_CONFIG.rotation.size,
      keep: LOG_CONFIG.rotation.keep,
      mkdir: LOG_CONFIG.rotation.mkdir,
    },
  });

  // Configure console output with pretty printing for development
  const consoleTransport = pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  });

  // Create the logger with both transports
  return pino(
    {
      level: process.env.LOG_LEVEL || config.level,
      formatters: {
        level: label => {
          return { level: label };
        },
      },
    },
    pino.multistream([
      { stream: fileTransport },
      ...(process.env.NODE_ENV !== 'production' ? [{ stream: consoleTransport }] : []),
    ])
  );
}

// Default logger instance - use this for general application logging
export const logger = createLogger('default');

// Export specific agent loggers for use in respective modules
export const betGradingLogger = createLogger('betGrading');
export const poolGenerationLogger = createLogger('poolGeneration');
