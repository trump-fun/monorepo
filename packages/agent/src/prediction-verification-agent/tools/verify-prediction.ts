/**
 * Tool: Verify Prediction
 *
 * This file serves as an entry point for the prediction verification functionality
 * when used as a tool by other agents.
 */

import { verifyPrediction, verifyPredictionBatch } from '../prediction-verification-graph';
import type { PredictionVerification } from '../types';

// Export the functions from the prediction verification graph
export { verifyPrediction, verifyPredictionBatch };
export type { PredictionVerification };
