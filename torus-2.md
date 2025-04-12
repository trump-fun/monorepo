# Source Tracing Agent

An advanced tool that follows reference chains to identify primary sources. Given any URL (blog post, news article, social media content), this agent intelligently crawls through the web, tracing information back to its source - whether a government document, academic paper, press release, or primary media.

The agent can be found here- https://github.com/trump-fun/monorepo/tree/feat/source-finder/packages/agent/src/source-tracing-agent

## Features

- **Recursive Reference Crawling**: Follows links across multiple sites to trace information to its origin
- **Source Classification**: Categorizes sources and evaluates their reliability
- **Smart Prioritization**: Intelligently decides which links to follow based on the likelihood of finding primary sources
- **Confidence Scoring**: Rates reliability of both individual sources and entire reference chains

## Tech Stack

- **TypeScript/Node.js**: Core application framework
- **LangChain + LangGraph**: Custom agent implementation with complex context management and robust tools for reasoning and planning
- **Firecrawl Integration**: Firecrawl is primarily used for its ability to return scraped content in LLM-friendly formats like markdown or XML, effectively stripping noise from HTML documents. While it is not the most reliable scraper, its out-of-the-box formatting logic significantly simplifies downstream processing.
- **Cheerio & Puppeteer**: HTML parsing and browser automation as fallback options
- **Zod**: Schema validation for structured data

## How It Works

1. Accepts a starting URL and extracts embedded links
2. Attempts content retrieval via Firecrawl API first, falling back to Puppeteer when needed
3. Build reference chains by following promising sources
4. Uses AI (via LangChain + LangGraph) to classify source types and extract key information
5. Identifies primary sources and calculates chain reliability

The agent uses a layered content retrieval strategy. Firecrawl is the first choice because of its pre-processed, LLM-ready output, despite occasional reliability issues. When Firecrawl fails, Puppeteer and Cheerio step in to ensure consistent results.

## Value Proposition

This agent provides essential transparency and verification capabilities for Torus by enabling users to trace information to its original sources quickly. In an era of information overload and misinformation, the Source Tracing Agent serves as a critical tool for fact-checking, research validation, and establishing the provenance of claims across the web. By automating the tedious process of following reference chains, it empowers users to make better-informed decisions based on reliable primary sources.

**Example Usage — Trump.fun**  
The Source Tracing Agent powers several content-verification features within [Trump.fun](https://trump.fun), serving as both an internal testing platform and real-world application. It enables automated fact-checking workflows and demonstrates the agent's value in fast-paced content environments.

## Documentation & Verification

Complete API documentation and implementation details are available in our [GitHub repository](https://github.com/source-tracing-agent), including examples, authentication methods, and response schemas. A functional demo is accessible via our [web interface](https://sourcetracer.demo) where users can test the agent with their own URLs.

## Development Roadmap

Our milestone-based development plan includes:

1. Enhance crawling capabilities with additional fallback methods
2. Implement advanced source classification models
3. Create a browser extension for on-demand source finding
4. \*Develop batch processing capabilities for analyzing multiple articles simultaneously
5. Add MCP interface to support usage as a tool by other agents

Each milestone will include public progress reports and open testing periods for community feedback.
