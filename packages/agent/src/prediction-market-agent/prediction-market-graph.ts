/**
 * Prediction Market Intelligence Agent
 *
 * This agent integrates several tools for analyzing prediction markets:
 * 1. Prediction Finder: Find predictions on X/Twitter related to specific topics
 * 2. Predictor Profile Builder: Analyze past predictions of specific accounts
 * 3. Prediction Verification: Verify if predictions have matured with evidence
 */

import { findPredictions } from '../prediction-finder-agent';
import { buildPredictorProfile } from '../predictor-profile-agent';
import {
  verifyPrediction,
  verifyPredictionBatch,
} from '../prediction-verification-agent/tools/verify-prediction';
import type { PredictionResult, PredictorProfile, PredictionVerification } from './types';

/**
 * Find X/Twitter posts containing predictions on a specific topic
 *
 * @param topic Topic to search for predictions about
 * @param limit Maximum number of predictions to return
 * @returns Array of predictions found
 */
export async function findPredictionsOnTopic(
  topic: string,
  limit: number = 10
): Promise<PredictionResult[]> {
  console.log(`Finding predictions on topic: ${topic} (limit: ${limit})`);
  return findPredictions(topic, limit);
}

/**
 * Build a profile of a predictor based on their past predictions on X/Twitter
 *
 * @param username X/Twitter username to analyze
 * @returns Profile with past predictions and analysis
 */
export async function buildPredictorProfileByUsername(username: string): Promise<PredictorProfile> {
  console.log(`Building predictor profile for @${username}`);
  return buildPredictorProfile(username);
}

/**
 * Verify if a prediction has matured (proven right or wrong) and collect evidence
 *
 * @param params Parameters for prediction verification
 * @returns Verification results including evidence and outcome
 */
export async function verifyPredictionWithEvidence(params: {
  prediction_text: string;
  prediction_date: string;
  prediction_source: string;
  predictor_username: string;
}): Promise<PredictionVerification> {
  console.log(`Verifying prediction: "${params.prediction_text}" by @${params.predictor_username}`);
  return verifyPrediction(params);
}

/**
 * Batch verify multiple predictions
 *
 * @param predictions Array of predictions to verify
 * @returns Array of verification results
 */
export async function verifyPredictionBatchWithEvidence(
  predictions: {
    prediction_text: string;
    prediction_date: string;
    prediction_source: string;
    predictor_username: string;
  }[]
): Promise<PredictionVerification[]> {
  console.log(`Batch verifying ${predictions.length} predictions`);
  return verifyPredictionBatch(predictions);
}
