// Export the agent functionality
export { bettingGraderGraph } from './src/bet-grading-agent/betting-grader-graph';
export { bettingPoolGeneratorGraph } from './src/pool-generation-agent/betting-pool-graph';

// Main entry point for direct execution
if (import.meta.main) {
  console.log('Trump.fun Agent - Use specific scripts to run agents');
  console.log('- For pool creation: bun pool-creation');
  console.log('- For bet grading: bun bet-grading');
}
