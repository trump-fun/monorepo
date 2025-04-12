import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Improved prompt for source analysis
 * More concise, focuses on key characteristics, and reduces redundancy
 */
export const sourceAnalysisPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert source analyst tasked with identifying the role of content in information chains.
    
    CLASSIFICATION GUIDE:
    
    PRIMARY SOURCES - Contains original information:
    - Government documents, official statements (.gov domains)
    - Original research, studies, datasets, or papers
    - Court documents, legal filings, official regulations
    - Financial reports, SEC filings
    - Original records by witnesses/participants
    - Corporate announcements, press releases
    - Patents, official IP documents
    
    SECONDARY SOURCES - Analyzes or interprets primary sources:
    - News articles reporting on events
    - Analysis of research findings
    - Expert reviews or commentary
    - Historical accounts
    
    TERTIARY SOURCES - Compiles secondary sources:
    - Bibliographies, directories, databases
    - Meta-analyses, literature reviews
    
    RULES:
    - E-commerce sites are NEVER primary sources
    - Primary sources must contain direct information/data
    - Extract all URLs that might lead to additional sources
    - Check for publication dates in any format
    - Identify key claims made in the content
    
    Your goal is to trace information to its original source.`,
  ],
  [
    'human',
    `URL: {url}
    
    CONTENT:
    {content}
    
    ADDITIONAL CONTEXT:
    {additional_context}
    
    Analyze this content to determine source type, referenced URLs, and original information indicators.`,
  ],
]);

/**
 * Prompt for summarizing a primary source
 * Used when a potential primary source is found to generate a concise summary
 */
export const primarySourceSummaryPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at summarizing primary sources.
    
    Create a concise, factual summary of the primary source content below.
    Focus on:
    1. The key factual claims or data
    2. What makes this a primary source
    3. The main evidence or information it presents
    
    Keep your summary objective, concise, and focused on verifiable content.`,
  ],
  [
    'human',
    `PRIMARY SOURCE URL: {url}
    
    CONTENT:
    {content}
    
    Create a concise summary of this primary source.`,
  ],
]);

/**
 * Prompt for determining source confidence
 * Used to assess the reliability and confidence in a source
 */
export const sourceConfidencePrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at evaluating source reliability.
    
    Assess the confidence level for this source based on:
    1. Authority (official status, credentials)
    2. Evidence quality (primary data, citations)
    3. Transparency (methodology, limitations)
    4. Consistency with established knowledge
    
    Provide a confidence score from 0-1 with justification.`,
  ],
  [
    'human',
    `SOURCE URL: {url}
    
    SOURCE TYPE: {source_type}
    
    CONTENT SUMMARY:
    {content_summary}
    
    KEY CLAIMS:
    {key_claims}
    
    Assess the confidence level for this source.`,
  ],
]);
