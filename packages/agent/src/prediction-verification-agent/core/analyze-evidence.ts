import { z } from 'zod';
import config from '../../config';
import { evidenceAnalysisPrompt } from '../prompts/verification-prompts';
import type { Evidence, PredictionVerification } from '../types';

/**
 * Analyzes collected evidence to determine if the prediction is correct/incorrect
 *
 * @param prediction Text of the prediction
 * @param predictionDate Date when the prediction was made
 * @param evidence Array of evidence objects
 * @returns Verification result object
 */
export async function analyzePredictionEvidence(
  prediction: string,
  predictionDate: string,
  evidence: Evidence[]
): Promise<PredictionVerification> {
  // If no evidence found, return unverifiable
  if (evidence.length === 0) {
    console.log('No evidence found to verify this prediction, returning default');
    return {
      source_text: prediction,
      prediction_date: predictionDate,
      verification_date: new Date().toISOString(),
      matured: false,
      outcome: 'pending',
      confidence_score: 0,
      evidence_urls: [],
      evidence_text: 'No relevant evidence found to verify this prediction.',
    };
  }

  // Format evidence for the LLM
  const evidenceText = evidence
    .map(
      (e, i) =>
        `Evidence ${i + 1}: [${e.source}] ${e.title}\nURL: ${e.url}\nDate: ${e.date}\nContent: ${e.snippet}`
    )
    .join('\n\n');

  try {
    console.log(`Analyzing evidence for prediction: "${prediction}"`);

    // Define schema for evidence analysis
    const analysisSchema = z.object({
      matured: z.boolean().describe('Whether the prediction has matured (can be verified)'),
      outcome: z
        .enum(['correct', 'partially_correct', 'incorrect', 'unverifiable', 'pending'])
        .describe('The outcome of the prediction based on evidence'),
      confidence_score: z
        .number()
        .min(0)
        .max(1)
        .describe('Confidence in the verification result (0-1)'),
      evidence_text: z.string().describe('Summary of the evidence and reasoning for the outcome'),
      reasoning: z.string().describe('Short summary of your reasoning for the outcome'),
    });

    // Use regular LLM to avoid structured output issues
    const formattedPrompt = await evidenceAnalysisPrompt.formatMessages({
      prediction,
      predictionDate,
      currentDate: new Date().toISOString(),
      evidenceText,
    });

    const structuredLlm = config.cheap_large_llm.withStructuredOutput(analysisSchema, {
      name: 'analyzeEvidence',
    });
    // First try with direct LLM call
    const response = await structuredLlm.invoke(formattedPrompt);

    const evidenceUrls = evidence.slice(0, Math.min(evidence.length, 3)).map(e => e.url);

    return {
      ...response,
      source_text: prediction,
      prediction_date: predictionDate,
      verification_date: new Date().toISOString(),
      evidence_urls: evidenceUrls,
    };
  } catch (error) {
    console.error('Error analyzing prediction evidence:', error);

    // Fallback response
    return {
      source_text: prediction,
      prediction_date: predictionDate,
      verification_date: new Date().toISOString(),
      matured: false,
      outcome: 'unverifiable',
      confidence_score: 0,
      evidence_urls: [],
      evidence_text: 'Error analyzing evidence: ' + String(error),
    };
  }
}
