import 'dotenv/config';
import { bettingGraderGraph } from './src/bet-grading-agent/betting-grader-graph';
import { DEFAULT_CHAIN_ID } from './src/config';

async function testBettingGrader() {
  console.log('Starting betting grader test');

  // Initial state for the grader graph
  const result = await bettingGraderGraph.invoke({
    messages: [],
    pendingPools: {}, // Will be populated by fetch_pending_pools node
    chainId: process.env.CHAIN_ID || DEFAULT_CHAIN_ID,
  });

  console.log('\n--- BETTING GRADER RESULTS ---');
  console.log(JSON.stringify(result, null, 2));
}

console.log('Running betting grader test');
testBettingGrader().catch(console.error);
