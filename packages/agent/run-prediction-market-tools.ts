import { program } from 'commander';
import 'dotenv/config';
import fs from 'fs/promises';
import { predictionMarketAgent } from './src/prediction-market-agent/prediction-market-agent';

// Configure command line interface
program
  .name('prediction-market-tools')
  .description('Tools for prediction market intelligence')
  .version('1.0.0');

// Find predictions command
program
  .command('find-predictions')
  .description('Find X posts containing predictions on a specific topic')
  .requiredOption('-t, --topic <topic>', 'Polymarket topic to search for predictions')
  .option('-l, --limit <number>', 'Maximum number of results', '10')
  .option('-o, --output <file>', 'Output file for results (JSON)')
  .action(async options => {
    try {
      console.log(`Searching for predictions on topic: ${options.topic}`);
      const predictions = await predictionMarketAgent.findPredictions(
        options.topic,
        parseInt(options.limit)
      );

      console.log(`Found ${predictions.length} predictions on topic: ${options.topic}`);

      // Format predictions for a more readable console output with fewer columns
      console.table(
        predictions.map((p, index) => ({
          id: index,
          author: p.author_username,
          prediction:
            p.prediction_text?.substring(0, 60) +
            ((p.prediction_text?.length ?? 0 > 60) ? '...' : ''),
          confidence: p.confidence_score.toFixed(1),
          type: p.implicit ? 'Implicit' : 'Explicit',
          timeframe: p.timeframe,
          topic: p.topic,
        }))
      );

      // Print full details for each prediction
      console.log('\nDetailed predictions:');
      predictions.forEach((p, i) => {
        console.log(`\n[${i}] Prediction by @${p.author_username} (${p.author_name || 'Unknown'})`);
        console.log(`URL: ${p.post_url}`);
        console.log(`Date: ${p.post_date}`);
        console.log(`Topic: ${p.topic} (Relevance: ${(p.topic_relevance || 0.5).toFixed(1)})`);
        console.log(`Text: ${p.prediction_text || 'No text available'}`);
        console.log(
          `Type: ${p.implicit ? 'Implicit' : 'Explicit'} | Confidence: ${(p.confidence_score || 0).toFixed(1)} | Timeframe: ${p.timeframe || 'unknown'}`
        );
      });

      // Save to file if specified
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(predictions, null, 2));
        console.log(`Results saved to ${options.output}`);
      }
    } catch (error) {
      console.error('Error finding predictions:', error);
      process.exit(1);
    }
  });

// Build predictor profile command
program
  .command('build-profile')
  .description('Build a profile of a predictor based on their X history')
  .requiredOption('-u, --username <username>', 'X/Twitter username to analyze')
  .option('-o, --output <file>', 'Output file for results (JSON)')
  .action(async options => {
    try {
      console.log(`Building profile for predictor: @${options.username}`);
      const profile = await predictionMarketAgent.buildPredictorProfile(options.username);

      console.log('\n--- PREDICTOR PROFILE ---');
      console.log(`Name: ${profile.display_name} (@${profile.username})`);
      console.log(`Bio: ${profile.bio}`);
      console.log(`Followers: ${profile.follower_count}`);
      console.log(`Predictions found: ${profile.prediction_count}`);
      console.log(`Expertise areas: ${profile.expertise_areas.join(', ')}`);

      console.log('\n--- PREDICTION STYLE ---');
      console.log(`Confidence level: ${profile.prediction_style.confidence_level.toFixed(2)}`);
      console.log(`Explicitness: ${profile.prediction_style.explicitness.toFixed(2)}`);
      console.log(`Evidence-based: ${profile.prediction_style.evidence_based.toFixed(2)}`);
      console.log(`Time horizon: ${profile.prediction_style.time_horizon}`);

      if (profile.verified_accuracy !== null && profile.verified_accuracy !== undefined) {
        console.log(`Verified accuracy: ${(profile.verified_accuracy * 100).toFixed(1)}%`);
      }

      console.log('\n--- RECENT PREDICTIONS ---');
      profile.past_predictions.slice(0, 5).forEach((p, i) => {
        console.log(`\n${i + 1}. "${p.prediction_text}"`);
        console.log(`   Date: ${new Date(p.prediction_date).toLocaleDateString()}`);
        console.log(`   Topic: ${p.topic}`);
        console.log(`   URL: ${p.post_url}`);
        if (p.outcome) {
          console.log(`   Outcome: ${p.outcome}`);
        }
      });

      // Save to file if specified
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(profile, null, 2));
        console.log(`\nProfile saved to ${options.output}`);
      }
    } catch (error) {
      console.error('Error building predictor profile:', error);
      process.exit(1);
    }
  });

// Verify prediction command
program
  .command('verify-prediction')
  .description('Verify if a prediction has matured and collect evidence')
  .requiredOption('-p, --prediction <text>', 'Prediction text to verify')
  .requiredOption('-d, --date <date>', 'Date when prediction was made (YYYY-MM-DD)')
  .requiredOption('-u, --username <username>', 'Predictor username')
  .requiredOption('-s, --source <url>', 'Source of prediction (URL)')
  .option('-o, --output <file>', 'Output file for results (JSON)')
  .action(async options => {
    try {
      const prediction = {
        prediction_text: options.prediction,
        prediction_date: options.date,
        predictor_username: options.username,
        prediction_source: options.source,
      };

      console.log(`Verifying prediction: "${options.prediction}"`);
      const result = await predictionMarketAgent.verifyPrediction(prediction);

      console.log('\n--- VERIFICATION RESULTS ---');
      console.log(`Prediction: "${result.prediction_text}"`);
      console.log(`By: @${result.predictor_username}`);
      console.log(`Made on: ${new Date(result.prediction_date).toLocaleDateString()}`);
      console.log(`Matured: ${result.matured ? 'Yes' : 'No'}`);
      console.log(`Outcome: ${result.outcome}`);
      console.log(`Confidence: ${(result.confidence_score * 100).toFixed(1)}%`);

      console.log('\n--- EVIDENCE ---');
      console.log(result.evidence_text);

      console.log('\n--- EVIDENCE SOURCES ---');
      result.evidence_urls.forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
      });

      // Save to file if specified
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(result, null, 2));
        console.log(`\nResults saved to ${options.output}`);
      }
    } catch (error) {
      console.error('Error verifying prediction:', error);
      process.exit(1);
    }
  });

// Batch verify from file command
program
  .command('batch-verify')
  .description('Batch verify predictions from a JSON file')
  .requiredOption('-f, --file <file>', 'JSON file containing predictions to verify')
  .option('-o, --output <file>', 'Output file for results (JSON)')
  .action(async options => {
    try {
      // Read predictions from file
      const fileContent = await fs.readFile(options.file, 'utf8');
      const predictions = JSON.parse(fileContent);

      console.log(`Batch verifying ${predictions.length} predictions from ${options.file}`);
      const results = await predictionMarketAgent.verifyPredictionBatch(predictions);

      console.log('\n--- BATCH VERIFICATION RESULTS ---');
      console.table(
        results.map(r => ({
          prediction:
            r.prediction_text.substring(0, 50) + (r.prediction_text.length > 50 ? '...' : ''),
          matured: r.matured ? 'Yes' : 'No',
          outcome: r.outcome,
          confidence: r.confidence_score.toFixed(2),
          evidenceCount: r.evidence_urls.length,
        }))
      );

      // Save to file if specified
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to ${options.output}`);
      }
    } catch (error) {
      console.error('Error batch verifying predictions:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
