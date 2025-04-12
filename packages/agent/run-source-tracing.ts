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

    console.log('\n--- SOURCE TRACING RESULTS ---');
    console.log(`Primary source found: ${result.primarySourceFound}`);

    if (result.primarySourceFound) {
      console.log(`Primary source URL: ${result.primarySourceUrl}`);
      console.log(`Primary source summary: ${result.primarySourceSummary}`);
    }

    console.log('\n--- REFERENCE CHAINS ---');
    result.referenceChains.forEach((chain, i) => {
      console.log(`\nChain ${i + 1} (Confidence: ${chain.confidence_score.toFixed(2)}):`);
      console.log(`Complete: ${chain.is_complete}`);

      chain.sources.forEach((source, j) => {
        console.log(`\n  Source ${j + 1}: ${source.url}`);
        console.log(`  Title: ${source.title || 'Unknown'}`);
        console.log(`  Type: ${source.source_type}`);
        console.log(`  Primary: ${source.contains_original_information}`);
        console.log(`  Verification: ${source.verification_status}`);
        console.log(`  Summary: ${source.content_summary.substring(0, 100)}...`);
      });
    });

    return result;
  } catch (error) {
    console.error('Error running source tracing:', error);
    throw error;
  }
}

// Run the script
runSourceTracing().catch(console.error);
