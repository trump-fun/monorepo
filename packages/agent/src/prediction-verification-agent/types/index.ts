import { z } from 'zod';

// Define schema for prediction verification
export const predictionVerificationSchema = z.object({
  source_text: z.string().describe('The original source text containing a prediction'),
  prediction_date: z
    .string()
    .describe(
      'When the prediction was made, ensuring the prediction was made before the bets were graded'
    ),
  matured: z.boolean().describe('Whether the prediction has matured/resolved'),
  outcome: z.enum(['correct', 'partially_correct', 'incorrect', 'unverifiable', 'pending']),
  confidence_score: z
    .number()
    .min(0)
    .max(1)
    .describe('How confident are we in this verification (0-1)'),
  evidence_urls: z.array(z.string()).describe('URLs supporting the verification'),
  evidence_text: z.string().describe('Text explaining the evidence for verification'),
  verification_date: z.string().describe('When this verification was performed'),
  // Additional detailed analysis fields
  key_facts: z.array(z.string()).optional().describe('List of key facts extracted from the evidence that support the outcome'),
  counter_evidence: z.array(z.string()).optional().describe('List of any evidence that contradicts the outcome'),
  timeline_analysis: z.string().optional().describe('Analysis of the timing aspects of the prediction and evidence'),
  sources_quality: z.string().optional().describe('Assessment of the quality and reliability of the evidence sources'),
  reasoning: z.string().optional().describe('Detailed reasoning explaining the analysis process and conclusion')
});

export type PredictionVerification = z.infer<typeof predictionVerificationSchema>;

// Evidence interface
export interface Evidence {
  source: string;
  title: string;
  url: string;
  date: string;
  snippet: string;
  relevance_score?: number;
  raw_content?: string;
}

// Interface for Tavily API search result
export interface TavilySearchResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  raw_content?: string;
}
