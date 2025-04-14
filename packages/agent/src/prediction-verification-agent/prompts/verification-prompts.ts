import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt template for extracting claims from a prediction
 */
export const claimsExtractionPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at extracting testable claims from predictions. 
    Extract the key claims made in the prediction that could be verified with evidence.
    Focus on specific, measurable outcomes rather than vague statements.
    Return ONLY a JSON array of strings, with each string being a single claim.`,
  ],
  ['human', `Prediction: {predictionText}`],
]);

/**
 * Prompt template for analyzing evidence to verify a prediction
 */
export const evidenceAnalysisPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at verifying predictions based on evidence.
    
    Analyze the prediction and the provided evidence to determine:
    1. Has the prediction matured (enough time has passed that we can say if it was right or wrong)?
    2. What was the outcome (correct, partially correct, incorrect, unverifiable, or still pending)?
    3. How confident are we in this verification (0-1 scale)?
    
    Consider:
    - The specificity of the prediction
    - The credibility of the evidence sources
    - The timeframe of the prediction
    - Any contradictory evidence
    
    Only mark a prediction as "correct" or "incorrect" if there is clear evidence.
    If the evidence is mixed, use "partially_correct".
    If there's insufficient evidence, use "unverifiable".
    If more time is needed for the prediction to mature, use "pending".
    
    Provide a clear explanation summarizing how the evidence supports your conclusion.`,
  ],
  [
    'human',
    `Prediction: "{prediction}"
    Prediction Date: {predictionDate}
    Current Date: {currentDate}
    
    Evidence:
    {evidenceText}
    
    Please verify this prediction based on the evidence provided.`,
  ],
]);
