# Prediction Finder Agent Proposal

## Overview

The Prediction Finder Agent finds what people predict on social media, mainly focusing on X/Twitter. It looks for both clear predictions ("X will happen") and implied ones ("I think X might happen").

## Value Proposition

This tool helps you:

- See what experts and the market are saying
- Keep track of who makes good predictions
- Collect and organize predictions for later analysis

## Technical Architecture

### Core Component

**Finding Predictions**

- Spots when someone makes a clear prediction
- Catches hints that suggest predictions
- Rates how sure we are it's actually a prediction

### Technical Requirements

- Node.js 22+
- Bun runtime
- 4GB RAM minimum
- API keys for:
  - Datura (X/Twitter API)
  - Tavily (search intelligence)
  - An LLM (OpenAI/Anthropic/Google)

### Implementation Stack

- TypeScript + Bun for core implementation
- LangChain/LangGraph for agent logic
- Datura API for social media integration
- Zod for schema validation

## Example Output

```json
{
  "prediction_text": "Tesla stock will reach $300 by end of 2023",
  "confidence_score": 0.87,
  "implicit": false,
  "topic_relevance": 0.95,
  "timeframe": "months",
  "has_condition": false,
  "post_id": "1234567890",
  "post_url": "https://x.com/username/status/1234567890",
  "author_username": "elonmusk",
  "author_name": "Elon Musk",
  "post_date": "2023-01-15T14:30:00.000Z",
  "topic": "Tesla stock price"
}
```

## Development Timeline

### Phase 1 (1-2 months)

- Basic prediction detection implementation
- X/Twitter integration
- Command line interface

### Phase 2 (2-3 months)

- Enhanced NLP models
- Multi-language support
- Batch processing capabilities

### Phase 3 (3-4 months)

- Web API development
- Dashboard integration
- Additional platform support

## Success Metrics

- Detection accuracy > 90% for explicit predictions
- False positive rate < 5%
- Processing latency < 2 seconds per post
- Platform uptime > 99.9%

## Integration Points

- REST API for third-party integration
- Webhook support for real-time updates
- Export capabilities for data analysis
- Integration with verification and profiling systems
