import { z } from 'zod';
import type { PredictionResult as BasePredictionResult } from '../../prediction-finder-agent/types';

/**
 * Extend the PredictionResult type to include the outcome property
 */
export interface PredictionResult extends BasePredictionResult {
  outcome?: 'correct' | 'partially_correct' | 'incorrect' | 'unverifiable' | 'pending';
}

/**
 * Schema for predictor profiles
 */
export const predictorProfileSchema = z.object({
  username: z.string().describe('X/Twitter username of the predictor'),
  display_name: z.string().describe('Display name of the predictor'),
  bio: z.string().describe('User bio/description'),
  follower_count: z.number().describe('Number of followers'),
  prediction_count: z.number().describe('Number of predictions found'),
  expertise_areas: z.array(z.string()).describe('Areas where the user makes predictions'),
  prediction_style: z.object({
    confidence_level: z
      .number()
      .min(0)
      .max(1)
      .describe('How confidently the user states predictions (0-1)'),
    explicitness: z.number().min(0).max(1).describe('How explicit their predictions are (0-1)'),
    evidence_based: z.number().min(0).max(1).describe('How much they cite evidence (0-1)'),
    time_horizon: z.string().describe('Typical timeframe of predictions (short/medium/long term)'),
  }),
  past_predictions: z.array(
    z.object({
      prediction_text: z.string(),
      prediction_date: z.string(),
      post_id: z.string(),
      post_url: z.string(),
      topic: z.string(),
      implicit: z.boolean(),
      outcome: z
        .enum(['correct', 'partially_correct', 'incorrect', 'unverifiable', 'pending'])
        .optional(),
      confidence_score: z.number().min(0).max(1),
    })
  ),
  verified_accuracy: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Accuracy of verified predictions (0-1)'),
});

/**
 * Type for predictor profiles
 */
export type PredictorProfile = z.infer<typeof predictorProfileSchema>;
