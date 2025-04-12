import { z } from 'zod';

/**
 * Schema for source extraction results
 */
export const sourceExtractionSchema = z.object({
  title: z.string().describe('The title of the article or page'),
  source_type: z
    .enum([
      'primary',
      'secondary',
      'tertiary',
      'social_media',
      'blog',
      'news',
      'official',
      'unknown',
    ])
    .describe('The apparent form/format of the source (used for scoring/heuristics only)'),
  referenced_urls: z.array(z.string()).describe('URLs referenced by this source'),
  content_summary: z.string().describe('A brief summary of the content'),
  contains_original_information: z
    .boolean()
    .describe('Whether this contains original information/statements not found in its references'),
  chain_distance_markers: z
    .object({
      has_no_references: z
        .boolean()
        .describe(
          'Whether this source has no references to other sources (potential chain endpoint)'
        ),
      is_directly_cited: z
        .boolean()
        .describe('Whether this source is directly cited by others (middle of chain)'),
      cites_primary_sources: z
        .boolean()
        .describe('Whether this source cites apparent primary/original sources'),
    })
    .describe('Markers to help position this source in the reference chain'),
  publication_date: z.string().optional().describe('Publication date if available'),
  verification_status: z
    .enum(['verified', 'partially_verified', 'unverified'])
    .describe('How well the information can be verified'),
  key_claims: z.array(z.string()).describe('Key claims made in the source'),
});

export type SourceExtractionResult = z.infer<typeof sourceExtractionSchema>;
