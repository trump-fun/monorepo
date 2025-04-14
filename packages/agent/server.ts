import 'dotenv/config';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { validator } from 'hono/validator';
import { z } from 'zod';
import type { PredictionResult } from './src/prediction-finder-agent/tools/find-predictions';
import { predictionMarketAgent } from './src/prediction-market-agent/prediction-market-agent';
import type { PredictionVerification } from './src/prediction-verification-agent/tools/verify-prediction';
import type { PredictorProfile } from './src/predictor-profile-agent/tools/build-predictor-profile';
import { traceSource } from './src/source-tracing-agent/source-tracing-graph';

// Define types for the application
interface Env {
  // This interface could be extended later with specific environment variables
  AUTH_USERNAME?: string;
  AUTH_PASSWORD?: string;
  PORT?: number;
}

// API response types
interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

// Using type alias instead of empty interface extension to avoid linter error
type FindPredictionsResponse = ApiResponse<{
  count: number;
  predictions: PredictionResult[];
}>;

type SourceTracingResponse = ApiResponse<{
  primarySourceFound: boolean;
  primarySourceUrl?: string;
  primarySourceSummary?: string;
  referenceChains: any[];
}>;

type VerifyPredictionResponse = ApiResponse<PredictionVerification>;

type PredictorProfileResponse = ApiResponse<PredictorProfile>;

type ErrorResponse = ApiResponse<never> & {
  status: 'error';
  message: string;
};

// Zod schemas for validation
const findPredictionsSchema = z.object({
  topic: z.string().describe('Topic to search for predictions'),
  limit: z.number().default(50).describe('Number of predictions to return'),
});

const sourceTracingSchema = z.object({
  url: z.string().url().describe('URL to trace back to source'),
});

const verifyPredictionSchema = z.object({
  prediction_text: z.string().describe('The prediction text to verify'),
  prediction_date: z.string().describe('When the prediction was made'),
  prediction_source: z.string().describe('Source of the prediction (URL, post ID)'),
  predictor_username: z.string().describe('Username of the person who made the prediction'),
});

const predictorProfileSchema = z.object({
  username: z.string().describe('X/Twitter username to analyze'),
});

// Create type from schema
type FindPredictionsParams = z.infer<typeof findPredictionsSchema>;
type SourceTracingParams = z.infer<typeof sourceTracingSchema>;
type VerifyPredictionParams = z.infer<typeof verifyPredictionSchema>;
type PredictorProfileParams = z.infer<typeof predictorProfileSchema>;

// Create Hono app with proper typing
const app = new Hono<{ Bindings: Env }>();

// Environment variables - required for server operation
if (!process.env.REST_API_PORT) {
  throw new Error('REST_API_PORT environment variable is required');
}
if (!process.env.REST_API_USERNAME) {
  throw new Error('REST_API_USERNAME environment variable is required');
}
if (!process.env.REST_API_PASSWORD) {
  throw new Error('REST_API_PASSWORD environment variable is required');
}

const PORT = parseInt(process.env.REST_API_PORT);
const AUTH_USERNAME = process.env.REST_API_USERNAME;
const AUTH_PASSWORD = process.env.REST_API_PASSWORD;

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use(
  '/api/*',
  basicAuth({
    username: AUTH_USERNAME,
    password: AUTH_PASSWORD,
  })
);

// Health check endpoint
app.get('/', c => {
  return c.json({
    status: 'ok',
    message: 'Prediction Market API is running',
  });
});

// Find predictions endpoint using Zod for validation
app.get(
  '/api/find-predictions',
  validator('query', async (value, c) => {
    const result = findPredictionsSchema.safeParse(value);

    if (!result.success) {
      const errorResponse: ErrorResponse = {
        status: 'error',
        message: result.error.errors[0]?.message || 'Invalid parameters',
      };
      return c.json(errorResponse, 400);
    }

    return result.data;
  }),
  async c => {
    try {
      // Get validated parameters
      const { topic, limit } = c.req.valid('query');

      console.log(`Searching for predictions on topic: ${topic}`);
      const predictions = await predictionMarketAgent.findPredictions(topic, limit);

      const response: FindPredictionsResponse = {
        status: 'success',
        data: {
          count: predictions.length,
          predictions,
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('Error finding predictions:', error);

      const errorResponse: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };

      return c.json(errorResponse, 500);
    }
  }
);

// Source tracing endpoint using Zod for validation
app.get(
  '/api/source-tracing',
  validator('query', async (value, c) => {
    const result = sourceTracingSchema.safeParse(value);

    if (!result.success) {
      const errorResponse: ErrorResponse = {
        status: 'error',
        message: result.error.errors[0]?.message || 'Invalid parameters',
      };
      return c.json(errorResponse, 400);
    }

    return result.data;
  }),
  async c => {
    try {
      // Get validated URL parameter
      const { url } = c.req.valid('query');

      console.log(`Tracing source chain for URL: ${url}`);
      const result = await traceSource(url);

      const response: SourceTracingResponse = {
        status: 'success',
        data: {
          primarySourceFound: result.primarySourceFound,
          primarySourceUrl: result.primarySourceUrl,
          primarySourceSummary: result.primarySourceSummary,
          referenceChains: result.referenceChains || [],
        },
      };

      return c.json(response);
    } catch (error) {
      console.error('Error tracing source:', error);

      const errorResponse: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };

      return c.json(errorResponse, 500);
    }
  }
);

// Verify prediction endpoint
app.get(
  '/api/verify-prediction',
  validator('query', async (value, c) => {
    const result = verifyPredictionSchema.safeParse(value);

    if (!result.success) {
      const errorResponse: ErrorResponse = {
        status: 'error',
        message: result.error.errors[0]?.message || 'Invalid parameters',
      };
      return c.json(errorResponse, 400);
    }

    return result.data;
  }),
  async c => {
    try {
      // Get validated parameters
      const prediction = c.req.valid('query');

      console.log(`Verifying prediction: "${prediction.prediction_text}"`);
      const result = await predictionMarketAgent.verifyPrediction(prediction);

      const response: VerifyPredictionResponse = {
        status: 'success',
        data: result,
      };

      return c.json(response);
    } catch (error) {
      console.error('Error verifying prediction:', error);

      const errorResponse: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };

      return c.json(errorResponse, 500);
    }
  }
);

// Build predictor profile endpoint
app.get(
  '/api/predictor-profile',
  validator('query', async (value, c) => {
    const result = predictorProfileSchema.safeParse(value);

    if (!result.success) {
      const errorResponse: ErrorResponse = {
        status: 'error',
        message: result.error.errors[0]?.message || 'Invalid username parameter',
      };
      return c.json(errorResponse, 400);
    }

    return result.data;
  }),
  async c => {
    try {
      // Get validated username parameter
      const { username } = c.req.valid('query');

      console.log(`Building profile for predictor: @${username}`);
      const profile = await predictionMarketAgent.buildPredictorProfile(username);

      const response: PredictorProfileResponse = {
        status: 'success',
        data: profile,
      };

      return c.json(response);
    } catch (error) {
      console.error('Error building predictor profile:', error);

      const errorResponse: ErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      };

      return c.json(errorResponse, 500);
    }
  }
);

// Start server
console.log(`Starting server on port ${PORT}...`);
export default {
  port: PORT,
  fetch: app.fetch,
  idleTimeout: 255, // Maximum allowed timeout (in seconds)
};
