import 'dotenv/config';
import { bettingGraderGraph } from './src/bet-grading-agent/betting-grader-graph';
import { DEFAULT_CHAIN_ID } from './src/config';
import { logger } from './src/logger';

async function testBettingGrader() {
  logger.info('Starting betting grader test');

  // Initial state for the grader graph
  const result = await bettingGraderGraph.invoke({
    messages: [],
    pendingPools: {}, // Will be populated by fetch_pending_pools node
    chainId: process.env.CHAIN_ID || DEFAULT_CHAIN_ID,
  });

  logger.info({ result }, 'BETTING GRADER RESULTS');
}

logger.info('Running betting grader test');
testBettingGrader().catch(error => logger.error({ error }, 'Error running betting grader'));
