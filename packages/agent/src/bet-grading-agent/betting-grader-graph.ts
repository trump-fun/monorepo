import { BaseMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { type Pool } from '@trump-fun/common';
import config, { DEFAULT_CHAIN_ID } from '../config';
import { callGradePoolContract } from './tools/call-grade-pool-contract';
import { callGradePoolContractSolana } from './tools/call-grade-pool-contract-solana';
import { fetchPendingPools } from './tools/fetch-pending-pools';
import { gatherEvidence } from './tools/gather-evidence';
import { generateEvidenceQueries } from './tools/generate-evidence-queries';
import { gradeBettingPoolIdea } from './tools/grade-betting-pool-idea';

export type PendingPool = {
  pool: Pool;
  evidenceSearchQueries: string[];
  evidence: Array<{
    url: string;
    summary: string;
    search_query: string;
  }>;
  gradingResult: {
    result: string;
    result_code: number;
    probabilities?: Record<string, number>;
    sources: string[];
    explanation: string;
  };
  contractUpdated: boolean;
  txHash: string;
  failed: boolean;
  xSearchQueries?: string[];
  xEvidence?: Array<{
    url: string;
    summary: string;
    search_query: string;
  }>;
};

// State annotation for the grader graph
const GraderStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  // Key is pool id
  pendingPools: Annotation<Record<string, PendingPool>>({
    value: (curr, update) => update,
    default: () => ({}) as Record<string, PendingPool>,
  }),
  chainId: Annotation<string>({
    value: (curr, update) => update,
    default: () => DEFAULT_CHAIN_ID,
  }),
});

// Define type alias for State
export type GraderState = typeof GraderStateAnnotation.State;

// Function to determine which chain to use
function selectChainType(state: GraderState): 'evm' | 'solana' | 'default' {
  if (config.chainConfig[state.chainId]?.chainType === 'evm') {
    return 'evm';
  } else if (config.chainConfig[state.chainId]?.chainType === 'solana') {
    return 'solana';
  }
  return 'default';
}

// Node function that just passes through the state - used for chain selection
async function chooseChainNode(state: GraderState): Promise<Partial<GraderState>> {
  return state;
}

// Create the graph
const builder = new StateGraph(GraderStateAnnotation);

// Add nodes to the graph
builder
  .addNode('fetch_pending_pools', fetchPendingPools)
  // .addNode('generate_x_queries', generateXQueries, { ends: ['gather_x_evidence'] })
  .addNode('generate_evidence_queries', generateEvidenceQueries /*, { ends: ['gather_evidence'] }*/)
  // .addNode('gather_x_evidence', gatherXEvidence, { ends: ['gather_evidence'] })
  .addNode('gather_tavily_evidence', gatherEvidence /*, { ends: ['grade_betting_pool_idea'] }*/)
  .addNode('grade_betting_pool_idea', gradeBettingPoolIdea /*, { ends: ['choose_chain'] }*/)
  .addNode('choose_chain', chooseChainNode)
  .addNode('call_grade_pool_contract_evm', callGradePoolContract)
  .addNode('call_grade_pool_contract_solana', callGradePoolContractSolana)
  .addEdge(START, 'fetch_pending_pools')
  // .addEdge('fetch_pending_pools', 'generate_x_queries')
  // .addEdge('generate_x_queries', 'gather_x_evidence')
  .addEdge('fetch_pending_pools', 'generate_evidence_queries')
  .addEdge('generate_evidence_queries', 'gather_tavily_evidence')
  // .addEdge('gather_x_evidence', 'grade_betting_pool_idea')
  .addEdge('gather_tavily_evidence', 'grade_betting_pool_idea')
  .addEdge('grade_betting_pool_idea', 'choose_chain')
  .addConditionalEdges('choose_chain', selectChainType, {
    evm: 'call_grade_pool_contract_evm',
    solana: 'call_grade_pool_contract_solana',
    default: 'call_grade_pool_contract_solana',
  })
  .addEdge('call_grade_pool_contract_evm', END)
  .addEdge('call_grade_pool_contract_solana', END);

// Compile the graph
export const bettingGraderGraph = builder.compile();
bettingGraderGraph.name = 'trump-fun-bet-grading-agent';

// Export a function to run a single node for testing
export async function runSingleNode(
  nodeName: keyof typeof bettingGraderGraph.nodes,
  state: GraderState
) {
  const node = bettingGraderGraph.nodes[nodeName];
  if (!node) {
    throw new Error(`Node '${nodeName}' not found in the graph`);
  }

  const result = await node.invoke(state);
  return result;
}
