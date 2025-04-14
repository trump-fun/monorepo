import { extractPredictionClaims } from './core/extract-claims';
import { searchForVerificationEvidence } from './core/search-evidence';
import { analyzePredictionEvidence } from './core/analyze-evidence';
import type { PredictionVerification } from './types';

/**
 * Verifies if a prediction has matured (proven right or wrong) and collects evidence
 *
 * @param params Parameters for prediction verification
 * @returns Verification results including evidence and outcome
 */
export async function verifyPrediction(params: {
  prediction_text: string;
  prediction_date: string;
}): Promise<PredictionVerification> {
  console.log(`Verifying prediction: "${params.prediction_text}"`);

  // Step 0:
  // Step 1: Extract key claim(s) from the prediction
  const claims = await extractPredictionClaims(params.prediction_text);

  // Step 2: Search for evidence related to these claims
  const evidenceResults = await searchForVerificationEvidence(claims, params.prediction_date);

  // Step 3: Analyze evidence to determine if prediction matured and is correct/incorrect
  const verificationResult = await analyzePredictionEvidence(
    params.prediction_text,
    params.prediction_date,
    evidenceResults
  );

  // Step 4: Return the full verification object with defaults for any missing properties
  return {
    ...params,
    matured: verificationResult.matured ?? false,
    outcome: verificationResult.outcome ?? 'pending',
    confidence_score: verificationResult.confidence_score ?? 0,
    evidence_urls: verificationResult.evidence_urls ?? [],
    evidence_text: verificationResult.evidence_text ?? 'No evidence provided',
    verification_date: new Date().toISOString(),
  };
}

/**
 * Batch verify multiple predictions
 *
 * @param predictions Array of predictions to verify
 * @returns Array of verification results
 */
export async function verifyPredictionBatch(
  predictions: {
    prediction_text: string;
    prediction_date: string;
  }[]
): Promise<PredictionVerification[]> {
  console.log(`Batch verifying ${predictions.length} predictions`);

  // Process predictions in batches of 5 to avoid rate limiting
  const batchSize = 5;
  const results: PredictionVerification[] = [];

  for (let i = 0; i < predictions.length; i += batchSize) {
    const batch = predictions.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

    const batchPromises = batch.map(pred => verifyPrediction(pred));
    const batchResults = await Promise.all(batchPromises);

    results.push(...batchResults);

    // Add a small delay between batches
    if (i + batchSize < predictions.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}
