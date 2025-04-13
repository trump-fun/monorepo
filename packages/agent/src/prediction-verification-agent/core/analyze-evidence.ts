import { z } from 'zod';
import config from '../../config';
import type { Evidence, PredictionVerification } from '../types';
import { evidenceAnalysisPrompt } from '../prompts/verification-prompts';

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
): Promise<Partial<PredictionVerification>> {
  // If no evidence found, return unverifiable
  if (evidence.length === 0) {
    return {
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
    });

    // Use regular LLM to avoid structured output issues
    const formattedPrompt = await evidenceAnalysisPrompt.formatMessages({
      prediction,
      predictionDate,
      currentDate: new Date().toISOString(),
      evidenceText,
    });

    // First try with direct LLM call
    const response = await config.large_llm.invoke(formattedPrompt);
    const responseText = response.content.toString();
    console.log('LLM response for evidence analysis:', responseText);

    // Parse the response text to extract key information
    const analysisResult = {
      matured: false,
      outcome: 'pending' as
        | 'pending'
        | 'correct'
        | 'partially_correct'
        | 'incorrect'
        | 'unverifiable',
      confidence_score: 0,
      evidence_text: 'Analysis in progress',
    };

    // Variable to store evidence summary text
    let summaryText = responseText;

    // Extract matured status with flexible pattern matching
    const maturedRegex = /matured:?\s*(yes|true|confirmed)/i;
    const hasMaturedRegex = /has\s*matured:?\s*(yes|true|confirmed)/i;
    const predictionMaturedRegex = /prediction\s*has\s*matured:?\s*(yes|true|confirmed)/i;

    if (
      maturedRegex.test(responseText) ||
      hasMaturedRegex.test(responseText) ||
      predictionMaturedRegex.test(responseText) ||
      responseText.toLowerCase().includes('prediction has matured') ||
      responseText.toLowerCase().includes('has been verified')
    ) {
      analysisResult.matured = true;
    }

    // Extract outcome with more flexible pattern matching
    const outcomeRegex =
      /outcome:?\s*(correct|partially[_\s]correct|incorrect|unverifiable|pending)/i;
    const resultRegex =
      /result:?\s*(correct|partially[_\s]correct|incorrect|unverifiable|pending)/i;
    const statusRegex =
      /status:?\s*(correct|partially[_\s]correct|incorrect|unverifiable|pending)/i;

    const outcomeMatch =
      responseText.match(outcomeRegex) ||
      responseText.match(resultRegex) ||
      responseText.match(statusRegex);

    if (outcomeMatch && outcomeMatch[1]) {
      const outcome = outcomeMatch[1].toLowerCase().replace(/\s+/g, '_');

      if (outcome === 'correct') {
        analysisResult.outcome = 'correct';
      } else if (outcome === 'partially_correct' || outcome === 'partially') {
        analysisResult.outcome = 'partially_correct';
      } else if (outcome === 'incorrect') {
        analysisResult.outcome = 'incorrect';
      } else if (outcome === 'unverifiable') {
        analysisResult.outcome = 'unverifiable';
      } else if (outcome === 'pending') {
        analysisResult.outcome = 'pending';
      }
    } else {
      // Broader content analysis if no explicit label
      const text = responseText.toLowerCase();
      if (text.includes('prediction is correct') || text.includes('proven correct')) {
        analysisResult.outcome = 'correct';
      } else if (text.includes('partially correct') || text.includes('partly correct')) {
        analysisResult.outcome = 'partially_correct';
      } else if (text.includes('prediction is incorrect') || text.includes('proven incorrect')) {
        analysisResult.outcome = 'incorrect';
      } else if (text.includes('cannot be verified') || text.includes('not enough evidence')) {
        analysisResult.outcome = 'unverifiable';
      }
    }

    // Extract confidence score with enhanced pattern matching
    const confidenceRegex = /confidence:?\s*(\d+(\.\d+)?)%?/i;
    const confidenceScoreRegex = /confidence\s*score:?\s*(\d+(\.\d+)?)%?/i;
    const certaintyRegex = /certainty:?\s*(\d+(\.\d+)?)%?/i;
    const levelOfConfidenceRegex = /level\s*of\s*confidence:?\s*(\d+(\.\d+)?)%?/i;

    const confidenceMatch =
      responseText.match(confidenceRegex) ||
      responseText.match(confidenceScoreRegex) ||
      responseText.match(certaintyRegex) ||
      responseText.match(levelOfConfidenceRegex);

    if (confidenceMatch && confidenceMatch[1]) {
      const score = parseFloat(confidenceMatch[1]);
      // Convert percentage to 0-1 scale if needed
      analysisResult.confidence_score = score > 1 ? score / 100 : score;
    } else {
      // Try to infer confidence from language
      const text = responseText.toLowerCase();
      if (text.includes('high confidence') || text.includes('very confident')) {
        analysisResult.confidence_score = 0.9;
      } else if (text.includes('moderate confidence') || text.includes('reasonably confident')) {
        analysisResult.confidence_score = 0.7;
      } else if (text.includes('low confidence') || text.includes('not very confident')) {
        analysisResult.confidence_score = 0.3;
      }
    }

    // Extract summary/reasoning
    // Use the summaryText variable we declared earlier
    const summaryMatch =
      responseText.match(/summary:([\s\S]*?)(?=\n\n|$)/i) ||
      responseText.match(/reasoning:([\s\S]*?)(?=\n\n|$)/i) ||
      responseText.match(/evidence summary:([\s\S]*?)(?=\n\n|$)/i) ||
      responseText.match(/conclusion:([\s\S]*?)(?=\n\n|$)/i) ||
      responseText.match(/analysis:([\s\S]*?)(?=\n\n|$)/i);

    if (summaryMatch && summaryMatch[1]) {
      summaryText = summaryMatch[1].trim();
    } else {
      // Try to find sections that look like a summary
      const paragraphs = responseText.split('\n\n');

      // Look for paragraphs that seem to be summaries
      for (const para of paragraphs) {
        if (
          para.toLowerCase().includes('based on the evidence') ||
          para.toLowerCase().includes('in conclusion') ||
          para.toLowerCase().includes('to summarize')
        ) {
          summaryText = para.trim();
          break;
        }
      }

      // If still no match, use a portion of the response as fallback
      if (summaryText === responseText) {
        const lines = responseText.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 3) {
          // Skip potential headers and get the meat of the analysis
          summaryText = lines.slice(2, Math.min(7, lines.length)).join('\n');
        }
      }
    }

    analysisResult.evidence_text = summaryText || 'Evidence analysis complete';

    // Get evidence URLs from the top 3 most relevant pieces of evidence
    const evidenceUrls = evidence.slice(0, Math.min(evidence.length, 3)).map(e => e.url);

    return {
      ...analysisResult,
      evidence_urls: evidenceUrls,
    };
  } catch (error) {
    console.error('Error analyzing prediction evidence:', error);

    // Fallback response
    return {
      matured: false,
      outcome: 'unverifiable',
      confidence_score: 0,
      evidence_urls: [],
      evidence_text: 'Error analyzing evidence: ' + String(error),
    };
  }
}
