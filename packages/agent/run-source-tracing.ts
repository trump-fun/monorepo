import 'dotenv/config';
import config from './src/config';

import { traceSource } from './src/source-tracing-agent/source-tracing-graph';

async function runSourceTracing() {
  console.log('Running source tracing agent...');
  console.log('API keys configured:');
  console.log('- Firecrawl API Key:', config.firecrawlApiKey ? 'Configured ✓' : 'Missing ✗');

  // Command line arguments - URL to trace
  const url = process.argv[2];
  if (!url) {
    console.error('Error: Please provide a URL to trace');
    console.log('Usage: bun run run-source-tracing.ts <url>');
    process.exit(1);
  }

  try {
    console.log(`\n--- TRACING SOURCE CHAIN FOR: ${url} ---`);

    // Run the source tracing
    const result = await traceSource(url);

    // Print the URL being traced
    console.log(url);
    console.log();

    console.log('--- SOURCE TRACING RESULTS ---');
    console.log(`Primary source found: ${result.primarySourceFound}`);

    if (result.primarySourceFound) {
      console.log(`Primary source URL: ${result.primarySourceUrl}`);
      console.log(`Primary source summary: ${result.primarySourceSummary}`);
    }

    console.log('--- REFERENCE CHAINS ---');
    if (result.referenceChains && result.referenceChains.length > 0) {
      result.referenceChains.forEach((chain, i) => {
        console.log(`Chain ${i + 1} (Confidence: ${chain.confidence_score.toFixed(2)}):`);
        console.log(`Complete: ${chain.is_complete}`);

        if (chain.sources && chain.sources.length > 0) {
          chain.sources.forEach((source, j) => {
            console.log(`  Source ${j + 1}: ${source.url || 'Unknown URL'}`);
            console.log(`  Title: ${source.title || 'Unknown'}`);
            console.log(`  Type: ${source.source_type || 'Unknown'}`);
            console.log(`  Primary: ${source.contains_original_information || false}`);
            console.log(`  Verification: ${source.verification_status || 'Unknown'}`);

            if (source.content_summary) {
              const summaryPreview =
                source.content_summary.length > 300
                  ? `${source.content_summary.substring(0, 300)}...`
                  : source.content_summary;
              console.log(`  Summary: ${summaryPreview}`);
            } else {
              console.log(`  Summary: No content available`);
            }
            console.log();
          });
        } else {
          console.log(`  No source information available in this chain`);
        }
      });
    } else {
      console.log(
        `No reference chains were created. Check if source tracing completed successfully.`
      );
    }

    return result;
  } catch (error) {
    console.error('Error running source tracing:', error);
    throw error;
  }
}

// Run the script
runSourceTracing().catch(console.error);
