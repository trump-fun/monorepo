import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt template for generating search queries to find predictions on a specific topic
 */
export const searchQueriesPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at finding predictions on social media.
    
    Generate effective search queries to find posts on X/Twitter that contain predictions about the given topic.
    
    Good search queries should:
    1. Include the following suffix to capture posts that contain prediction terms: (bet OR predict OR forecast OR expect OR anticipate OR foresee OR speculate OR speculates OR speculating OR gamble OR foresee)
    2. Include the main topic keywords and synonyms
    3. Sometimes include timeframes ("next year", "by 2025")
    4. Sometimes include opinion markers ("think", "believe", "in my opinion")
    5. Be diverse to capture different ways people express predictions
    6. Should put sequences of words in quotes, as spaces between words are an implicit AND in X/Twitter search
    7. To reiterate, your query and variations of the query must contain keywords either directly in the topic or relevant to the topic. Avoid extra or superfluous words

    Examples:
    Topic: "Will Ukraine enter a deal with the US to repay war funding with precious metals?"
    Good queries:
    - "("bet" OR "predict" OR "forecast" OR "expect") AND "Ukraine" AND ("precious metals" OR metal)  //Checks for prediction terms alongside the keywords from the topic
    - "("bet" OR "predict" OR "forecast" OR "expect") AND "Zelenskyy" AND "Trump" AND metal // Search for figures related to the topic with the critical keyword from the topic
    - "Ukraine" "minerals"  (US OR "United States" OR America) ("I bet" OR "my prediction" OR "speculate" OR "anticipate" OR "foresee" OR "proves") // Uses what is effectively a synonym of "precious metals" and captures variations of the spelling of the United States in addition to a bevy of prediction terms
    Bad queries:
    - "Ukraine" "repay" "war" "funding" "precious" "metals" // This is the same as Ukraine AND repay AND war AND funding AND precious AND metals, which is too specific. "repay" and "funding" should be dropped as they’re not critical keywords, and precious metals should be in quotes as its a sequence of words
    - "Ukraine" "metal" "deal" "United States" (predict OR prediction OR expect OR likely OR probability OR chances OR will happen OR going to OR bet that) // The content in this query is fine, but it doesn't quote sequences of words,  will happen OR going to OR bet that should have been \"will happen\" or \"going to\" or \"bet that\"
   
    Topic: "Will ANO win the most seats in the next Czech parliamentary election?"
    Good queries:
    - "ANO" "Czech" "election" ("I predict" OR "my prediction" OR "will win" OR "expect" OR "forecast" OR "anticipate" OR "bet") // This is a good query because it contains the critical keywords and doesn't limit the content we search for
    Bad queries:
    - ANO Czech election "I predict" OR "my prediction" OR "will win" OR "expect" -filter:replies // -filter:replies is limiting
    
    Topic: "What comes first, dogpack404 Mr. Beast expose part 3, or the public announcement of a defamation lawsuit"
    Good queries:
    - (bet OR predict OR forecast OR expect) AND (dogpack404 AND "Mr. Beast" OR "Mr Beast") AND (lawsuit OR expose OR defamation)" // Contains the critical keywords and also takes into account possible variations on the names involved
  
    Return a list of exactly 3 specific search queries that would be effective at finding predictions.`,
  ],
  [
    'human',
    `Topic: {topic}
    
    Generate search queries to find predictions about this topic on X/Twitter.`,
  ],
]);

/**
 * Prompt template for analyzing if a post contains a prediction
 */
export const predictionAnalysisPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert at identifying predictions in social media posts.
    
    Analyze the given post to determine if it contains a prediction related to the specified topic.
    
    A prediction is a statement about future events or outcomes. It can be:
    - Explicit: "I predict X will happen"
    - Implicit: "X is inevitable" or "X won't last long"
    
    Consider:
    1. Does the post make a claim about a future event or outcome?
    2. Is the prediction related to the given topic?
    3. How confident are you that this is a genuine prediction?
    4. What timeframe does the prediction cover?
    `,
  ],
  [
    'human',
    `- Post: "{text}"
     - Topic: "{topic}"
    
    Does this post contain a prediction related to the topic? If so, analyze it.`,
  ],
]);

export const daturaAiSearchPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `The user will provider you with a market from Polymarket.
    Your job is to search for X posts that contain predictions about this market on X.
    
    Guidelines:
    - Prefer recent posts
    - Posts must be relevant to the market and should contain keywords from the topic
    - You should seek posts from people who have a verifiable presence on X

    You should search for posts that are recent and contain predictions about the market.
    `,
  ],
  [
    'human',
    `Market: "{market}"
    
    Search for X posts that contain predictions about this market on X.`,
  ],
]);
