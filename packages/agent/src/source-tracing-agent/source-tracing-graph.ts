/**
 * Source Tracing Agent
 *
 * This graph specializes in tracing information back to its original source through reference chains.
 * Given a URL or piece of content, it will follow references (citations, links, etc.) to identify
 * primary sources and evaluate the information pathway.
 */
import type { BaseMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { v4 as uuidv4 } from 'uuid';
import type { ReferenceChain } from '../types/research-item';
import { traceSourceChain } from './core/source-tracing';

// Define source tracing state
const SourceTracingAnnotation = Annotation.Root({
  startingUrl: Annotation<string>(),
  referenceChains: Annotation<ReferenceChain[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  primarySourceFound: Annotation<boolean>({
    value: (curr, update) => update,
    default: () => false,
  }),
  primarySourceUrl: Annotation<string>({
    value: (curr, update) => update || curr,
    default: () => '',
  }),
  primarySourceSummary: Annotation<string>({
    value: (curr, update) => update || curr,
    default: () => '',
  }),
  traceComplete: Annotation<boolean>({
    value: (curr, update) => update,
    default: () => false,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
});

export type SourceTracingState = typeof SourceTracingAnnotation.State;

// Create a mock research item structure to interface with the tracing tool
function createMockResearchItem(url: string) {
  return {
    truth_social_post: {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      content: `<a href="${url}">${url}</a>`,
    },
    external_link_url: url,
    should_process: true,
  };
}

// Adapter function to use the trace-source-chain tool
async function traceSourceAdapter(state: SourceTracingState): Promise<Partial<SourceTracingState>> {
  if (!state.startingUrl) {
    return {
      traceComplete: true,
      primarySourceFound: false,
    };
  }

  // Create a mock research item to use with the existing tool
  const mockResearchState = {
    research: createMockResearchItem(state.startingUrl),
    targetTruthSocialAccountId: '',
    chainConfig: {
      chain: '',
      subgraphUrl: '',
      subgraphApiKey: '',
      rpcUrl: '',
      bettingFactoryAddress: '',
      ignitionRegistryAddress: '',
      contractAddress: '',
      privateKey: '',
    },
    messages: [],
  };

  // Call the tracing tool
  // @ts-expect-error todo
  const result = await traceSourceChain(mockResearchState);

  if (!result.research) {
    return {
      traceComplete: true,
      primarySourceFound: false,
    };
  }

  return {
    referenceChains: result.research.reference_chains || [],
    primarySourceFound: result.research.primary_source_found || false,
    primarySourceUrl: result.research.primary_source_url || '',
    primarySourceSummary: result.research.primary_source_summary || '',
    traceComplete: true,
  };
}

// Create the graph
const builder = new StateGraph(SourceTracingAnnotation);

// Add the tracing node
builder
  .addNode('trace_sources', traceSourceAdapter)
  .addEdge(START, 'trace_sources')
  .addEdge('trace_sources', END);

// Compile the graph
export const sourceTracingGraph = builder.compile();
sourceTracingGraph.name = 'trump-fun-source-tracing';

// Export a function to run the graph
export async function traceSource(url: string) {
  return await sourceTracingGraph.invoke({
    startingUrl: url,
  });
}
