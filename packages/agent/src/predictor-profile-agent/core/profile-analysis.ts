import { z } from 'zod';
import config from '../../config';
import { predictorStylePrompt } from '../prompts/profile-analysis';
import type { PredictionResult } from '../types';

/**
 * Analyzes prediction style and expertise areas
 *
 * @param predictions Array of predictions to analyze
 * @param userBio User's bio/profile description
 * @returns Analysis of prediction style and expertise
 */
export async function analyzePredictionStyle(
  predictions: PredictionResult[],
  userBio: string
): Promise<{
  expertise_areas: string[];
  prediction_style: {
    confidence_level: number;
    explicitness: number;
    evidence_based: number;
    time_horizon: string;
  };
  verified_accuracy: number | null;
}> {
  // If no predictions found, return default values
  if (predictions.length === 0) {
    return {
      expertise_areas: [],
      prediction_style: {
        confidence_level: 0.5,
        explicitness: 0.5,
        evidence_based: 0.5,
        time_horizon: 'medium',
      },
      verified_accuracy: null,
    };
  }

  // Prepare prediction texts for analysis
  const predictionTexts = predictions
    .map(
      (p, i) =>
        `Prediction ${i + 1}: "${p.prediction_text}" (Topic: ${p.topic}, Date: ${p.post_date})`
    )
    .join('\n\n');

  try {
    // Create structured output
    const structuredLlm = config.cheap_large_llm.withStructuredOutput({
      expertise_areas: z.array(z.string()),
      prediction_style: z.object({
        confidence_level: z.number().min(0).max(1),
        explicitness: z.number().min(0).max(1),
        evidence_based: z.number().min(0).max(1),
        time_horizon: z.string(),
      }),
    });

    // Format the messages and call the LLM
    const formattedPrompt = await predictorStylePrompt.formatMessages({
      userBio,
      predictionTexts,
    });

    const result = await structuredLlm.invoke(formattedPrompt);

    // Calculate verified accuracy if available
    let verifiedAccuracy = null;
    const verifiedPredictions = predictions.filter(
      p => p.outcome === 'correct' || p.outcome === 'partially_correct' || p.outcome === 'incorrect'
    );

    if (verifiedPredictions.length > 0) {
      const correctCount = verifiedPredictions.filter(p => p.outcome === 'correct').length;
      const partialCount = verifiedPredictions.filter(
        p => p.outcome === 'partially_correct'
      ).length;
      verifiedAccuracy = (correctCount + partialCount * 0.5) / verifiedPredictions.length;
    }

    return {
      ...result,
      verified_accuracy: verifiedAccuracy,
    };
  } catch (error) {
    console.error('Error analyzing prediction style:', error);

    // Return basic analysis based on raw stats
    const implicitCount = predictions.filter(p => p.implicit).length;
    const explicitness = 1 - implicitCount / predictions.length;

    // Extract topics
    const topics = predictions.map(p => p.topic);
    const uniqueTopics = Array.from(new Set(topics));

    return {
      expertise_areas: uniqueTopics.slice(0, 5),
      prediction_style: {
        confidence_level: 0.5,
        explicitness: explicitness,
        evidence_based: 0.5,
        time_horizon: 'medium',
      },
      verified_accuracy: null,
    };
  }
}
