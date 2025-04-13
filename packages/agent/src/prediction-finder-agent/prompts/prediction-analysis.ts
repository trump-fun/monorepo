import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt template for generating search queries to find predictions on a specific topic
 */
export const searchQueriesPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at finding predictions on social media.
    
    Generate effective search queries to find posts on X/Twitter that contain predictions about the given topic.
    
    Good search queries should:
    1. Include variations on prediction language ("predict", "forecast", "will happen", "expect")
    2. Include the main topic keywords and synonyms
    3. Sometimes include timeframes ("next year", "by 2025")
    4. Sometimes include opinion markers ("I think", "I believe", "in my opinion")
    5. Be diverse to capture different ways people express predictions
    
    Return a list of 3-5 specific search queries that would be effective at finding predictions.`,
  ],
  [
    'human',
    `Topic: {topic}
    
    Generate search queries to find predictions about this topic on X/Twitter.`,
  ],
]);

/**
 * Prompt template for analyzing if a post contains a prediction
 */
export const predictionAnalysisPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at identifying predictions in social media posts.
    
    Analyze the given post to determine if it contains a prediction related to the specified topic.
    
    A prediction is a statement about future events or outcomes. It can be:
    - Explicit: "I predict X will happen"
    - Implicit: "X is inevitable" or "X won't last long"
    
    Consider:
    1. Does the post make a claim about a future event or outcome?
    2. Is the prediction related to the given topic?
    3. How confident are you that this is a genuine prediction?
    4. What timeframe does the prediction cover?
    `,
  ],
  [
    'human',
    `- Post: "{text}"
     - Topic: "{topic}"
    
    Does this post contain a prediction related to the topic? If so, analyze it.`,
  ],
]);
