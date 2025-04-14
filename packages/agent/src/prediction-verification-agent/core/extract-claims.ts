import config from '../../config';
import { claimsExtractionPrompt } from '../prompts/verification-prompts';

/**
 * Extracts key claims from a prediction text
 *
 * @param predictionText Text of the prediction to analyze
 * @returns Array of claim statements that can be verified
 */
export async function extractPredictionClaims(predictionText: string): Promise<string[]> {
  // Ensure predictionText isn't empty or missing important parts
  if (!predictionText || predictionText.trim().length < 5) {
    console.warn('Prediction text is too short or empty');
    return ['No valid prediction provided'];
  }

  // Fix common issues with prediction text, like dollar signs being stripped
  const sanitizedText = predictionText.replace(/\s+(by|reach)\s+(?=\d)/gi, ' $1 $');

  try {
    console.log(`Extracting claims from prediction: "${sanitizedText}"`);
    const formattedPrompt = await claimsExtractionPrompt.format({
      predictionText: sanitizedText,
    });
    const result = await config.cheap_large_llm.invoke(formattedPrompt);
    let claims: string[] = [];

    // Parse the result, which should be a JSON array of strings
    try {
      const content = result.content.toString().trim();
      console.log('Raw LLM response:', content);

      // Try multiple parsing approaches
      if (content.includes('[') && content.includes(']')) {
        // Extract array content using regex
        const arrayMatch = content.match(/\[([^\[\]]*)\]/);
        if (arrayMatch && arrayMatch[1]) {
          // Split by commas and clean up each item
          claims = arrayMatch[1]
            .split(',')
            .map(item => item.trim().replace(/^"|"$/g, '')) // Remove quotes
            .filter(item => item.length > 0);
        }
      }

      // If regex approach failed, try JSON parsing with cleanup
      if (claims.length === 0) {
        // Strip any markdown formatting and clean up JSON
        const jsonString = content
          .replace(/```json|```/g, '')
          .replace(/\n/g, ' ')
          .trim();

        try {
          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed)) {
            claims = parsed;
          } else if (typeof parsed === 'object' && parsed.claims && Array.isArray(parsed.claims)) {
            claims = parsed.claims;
          }
        } catch (innerError) {
          // JSON parsing failed, continue to fallback
        }
      }
    } catch (parseError) {
      console.error('Error parsing claims from LLM response:', parseError);
    }

    // Fallback if all parsing attempts failed
    if (claims.length === 0) {
      claims = [sanitizedText];
      console.log('Using fallback claim extraction');
    }

    console.log(`Extracted ${claims.length} claims from prediction:`, claims);
    return claims;
  } catch (error) {
    // Safe error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error extracting prediction claims: ${errorMessage}`);
    return [predictionText]; // Fallback to using the whole prediction as a claim
  }
}
