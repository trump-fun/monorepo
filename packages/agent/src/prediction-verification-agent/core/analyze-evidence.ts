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

  // Sort evidence by relevance score and date (newest first)
  const sortedEvidence = [...evidence].sort((a, b) => {
    // First prioritize by relevance score
    const relevanceDiff = (b.relevance_score ?? 0) - (a.relevance_score ?? 0);
    if (relevanceDiff !== 0) return relevanceDiff;

    // If relevance is the same, sort by date (newest first)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  // Format evidence for the LLM with detailed metadata
  const evidenceText = sortedEvidence
    .map((e, i) => {
      const date = new Date(e.date).toISOString().split('T')[0];
      return (
        `Evidence ${i + 1}: [${e.source}] ${e.title}
` +
        `URL: ${e.url}
` +
        `Date: ${date}
` +
        `Relevance Score: ${(e.relevance_score ?? 0).toFixed(2)}
` +
        `Content: ${e.snippet}`
      );
    })
    .join('\n\n');

  try {
    console.log(`Analyzing evidence for prediction: "${prediction}"`);

    // Define schema for evidence analysis with more detailed fields
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
      evidence_text: z
        .string()
        .describe('Comprehensive summary of the evidence and reasoning for the outcome'),
      reasoning: z
        .string()
        .describe('Detailed reasoning explaining your analysis process and conclusion'),
      key_facts: z
        .array(z.string())
        .describe('List of key facts extracted from the evidence that support the outcome'),
      counter_evidence: z
        .array(z.string())
        .describe('List of any evidence that contradicts the outcome'),
      timeline_analysis: z
        .string()
        .describe('Analysis of the timing aspects of the prediction and evidence'),
      sources_quality: z
        .string()
        .describe('Assessment of the quality and reliability of the evidence sources'),
    });

    // Get current date for temporal analysis
    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toISOString();

    // Calculate time elapsed since prediction
    const predDate = new Date(predictionDate);
    const daysSincePrediction = Math.floor(
      (currentDate.getTime() - predDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Extract deadline from prediction (if any)
    const deadlineMatch = prediction.match(
      /within\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)/i
    );
    let deadline = undefined;
    if (deadlineMatch) {
      const amount = parseInt(deadlineMatch[1]!);
      const unit = deadlineMatch[2]!.toLowerCase();

      // Convert to days
      let deadlineDays = amount;
      if (unit.includes('week')) deadlineDays = amount * 7;
      if (unit.includes('month')) deadlineDays = amount * 30;
      if (unit.includes('year')) deadlineDays = amount * 365;

      deadline = deadlineDays;
    }

    // Use high-quality LLM to get a more thorough analysis
    const formattedPrompt = await evidenceAnalysisPrompt.formatMessages({
      prediction,
      predictionDate,
      currentDate: formattedCurrentDate,
      daysSincePrediction: daysSincePrediction.toString(),
      deadline: deadline?.toString() || '',
      evidenceText,
      evidenceCount: evidence.length.toString(),
    });

    // Use the large model for more thorough analysis
    const structuredLlm = config.large_llm.withStructuredOutput(analysisSchema, {
      name: 'analyzeEvidence',
    });

    console.log('Performing deep analysis of evidence...');
    const response = await structuredLlm.invoke(formattedPrompt);

    // Include all evidence URLs, not just the first 3
    const evidenceUrls = evidence.map(e => e.url);

    // Create comprehensive verification result
    return {
      ...response,
      source_text: prediction,
      prediction_date: predictionDate,
      verification_date: new Date().toISOString(),
      evidence_urls: evidenceUrls,
      // Include additional structured analysis fields
      key_facts: response.key_facts,
      counter_evidence: response.counter_evidence,
      timeline_analysis: response.timeline_analysis,
      sources_quality: response.sources_quality,
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
