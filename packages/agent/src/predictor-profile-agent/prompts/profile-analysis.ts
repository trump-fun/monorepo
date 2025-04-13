import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt template for analyzing if a post contains a prediction
 */
export const predictionIdentificationPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    "You analyze social media posts to identify predictions. Look for statements about future events, either explicit (using words like 'predict', 'will happen') or implicit ('inevitable', 'bound to'). For posts containing predictions, provide details on topic, explicitness, confidence level (0-1), and timeframe. For posts without predictions, respond accordingly.",
  ],
  [
    'human',
    "I need to analyze the following post to determine if it contains a prediction:\n\nPost ID: {postId}\nPost Date: {postDate}\nPost URL: {postUrl}\nPost Text: {postText}\n\nDoes this post contain a prediction about future events? If yes, what is the prediction about, is it explicit or implicit, and what's your confidence level (0-1) that this is a genuine prediction?",
  ],
]);

/**
 * Prompt template for analyzing a predictor's style and expertise areas
 */
export const predictorStylePrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at analyzing prediction patterns and styles.
    
    Analyze the given predictions from a single user to determine:
    
    1. Expertise areas: What topics does this user frequently make predictions about?
    2. Prediction style:
       - Confidence level: How confidently does the user state predictions? (0-1 scale)
       - Explicitness: Are predictions mostly explicit or implicit? (0-1 scale where 1 is fully explicit)
       - Evidence-based: Do they cite evidence or reasoning for predictions? (0-1 scale)
       - Time horizon: What's their typical prediction timeframe? (short/medium/long term)
    
    Also consider the user's bio when determining their expertise areas.`,
  ],
  [
    'human',
    `User Bio: "{userBio}"
    
    Predictions:
    {predictionTexts}
    
    Please analyze this predictor's style and expertise areas.`,
  ],
]);
