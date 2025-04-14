import { z } from 'zod';

// Define schema for prediction verification
export const predictionVerificationSchema = z.object({
  prediction_text: z.string().describe('The original prediction text'),
  prediction_date: z.string().describe('When the prediction was made'),
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
}
