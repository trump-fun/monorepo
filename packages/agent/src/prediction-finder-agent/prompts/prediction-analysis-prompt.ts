/**
 * Prediction Analysis Prompt
 * 
 * Optimized prompt for analyzing social media posts to identify and classify predictions
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';

export const PREDICTION_ANALYSIS_SYSTEM_PROMPT = `You are an expert at identifying and analyzing predictions made on social media.
Your task is to determine if a post contains a prediction related to a specific topic, and if so, extract key information about that prediction.

A prediction is a statement about future events or outcomes. It should:
1. Make a clear claim about something that will/might happen in the future
2. Be specific enough to be verifiable later
3. Include a timeframe (explicit or implicit)

INSTRUCTIONS:
- Analyze the post to determine if it contains a prediction related to the given topic
- Extract the core prediction and relevant details
- Assess the confidence level expressed by the predictor
- Identify any conditions attached to the prediction
- Determine the timeframe for when the prediction is expected to occur
- Classify the prediction sentiment (positive, negative, or neutral)

Return a JSON object with this structure:
{
  "is_prediction": boolean,
  "prediction_text": string,
  "implicit": boolean,
  "confidence_score": number,  // 0.0-1.0
  "timeframe": "short_term"|"medium_term"|"long_term"|"uncertain",
  "has_condition": boolean,
  "prediction_sentiment": "positive"|"negative"|"neutral",
  "topic_relevance": number    // 0.0-1.0
}

EXAMPLES:

Post: "I think Bitcoin will definitely hit $100k by the end of 2025. The momentum is too strong."
Topic: "Bitcoin price"
{
  "is_prediction": true,
  "prediction_text": "Bitcoin will hit $100k by the end of 2025",
  "implicit": false,
  "confidence_score": 0.9,
  "timeframe": "medium_term",
  "has_condition": false,
  "prediction_sentiment": "positive",
  "topic_relevance": 1.0
}

Post: "The market is looking bearish today. Lots of red across the board."
Topic: "Stock market"
{
  "is_prediction": false,
  "prediction_text": "",
  "implicit": false,
  "confidence_score": 0.0,
  "timeframe": "uncertain",
  "has_condition": false,
  "prediction_sentiment": "neutral",
  "topic_relevance": 0.7
}`;

export const PREDICTION_ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
  ['system', PREDICTION_ANALYSIS_SYSTEM_PROMPT],
  [
    'human',
    `Please analyze this post to determine if it contains a prediction related to the topic "{topic}":

Post ID: {post_id}
Author: @{username}
Date: {post_date}
Content: {post_text}

If links or media are mentioned: {post_links}

Analyze this carefully and return the structured JSON response.`
  ],
]);

export const PREDICTION_ANALYSIS_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    is_prediction: { type: 'boolean' },
    prediction_text: { type: 'string' },
    implicit: { type: 'boolean' },
    confidence_score: { type: 'number', minimum: 0, maximum: 1 },
    timeframe: { type: 'string', enum: ['short_term', 'medium_term', 'long_term', 'uncertain'] },
    has_condition: { type: 'boolean' },
    prediction_sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
    topic_relevance: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'is_prediction',
    'prediction_text',
    'implicit',
    'confidence_score',
    'timeframe',
    'has_condition',
    'prediction_sentiment',
    'topic_relevance'
  ],
};
