/**
 * Prediction Market Intelligence Agent
 *
 * Provides tools for finding predictions, analyzing predictors, and verifying predictions.
 * This agent acts as a coordination layer for the other specialized prediction agents.
 */

import {
  findPredictionsOnTopic,
  buildPredictorProfileByUsername,
  verifyPredictionWithEvidence,
  verifyPredictionBatchWithEvidence,
} from './prediction-market-graph';

export {
  findPredictionsOnTopic,
  buildPredictorProfileByUsername,
  verifyPredictionWithEvidence,
  verifyPredictionBatchWithEvidence,
};

export type { PredictionResult, PredictorProfile, PredictionVerification } from './types';

/**
 * Class providing a unified interface to prediction market intelligence tools
 */
class PredictionMarketAgent {
  /**
   * Find X/Twitter posts containing predictions on a specific topic
   */
  async findPredictions(topic: string, limit: number = 10) {
    return findPredictionsOnTopic(topic, limit);
  }

  /**
   * Build a profile of a predictor based on their past predictions
   */
  async buildPredictorProfile(username: string) {
    return buildPredictorProfileByUsername(username);
  }

  /**
   * Verify if a prediction has matured and collect evidence
   */
  async verifyPrediction(params: {
    prediction_text: string;
    prediction_date: string;
    prediction_source: string;
    predictor_username: string;
  }) {
    return verifyPredictionWithEvidence(params);
  }

  /**
   * Batch verify multiple predictions
   */
  async verifyPredictionBatch(
    predictions: {
      prediction_text: string;
      prediction_date: string;
      prediction_source: string;
      predictor_username: string;
    }[]
  ) {
    return verifyPredictionBatchWithEvidence(predictions);
  }
}

// Export a singleton instance for backwards compatibility
export const predictionMarketAgent = new PredictionMarketAgent();
