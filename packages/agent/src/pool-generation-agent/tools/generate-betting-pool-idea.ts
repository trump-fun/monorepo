import config from '../../config';
import type { SingleResearchItem } from '../../types/research-item';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

/**
 * Generates a Yes/No betting pool question for a single research item
 * The question is written in Trump's distinctive communication style
 */
export async function generateBettingPoolIdea(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Generating betting pool idea for research item');

  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    console.log('No research item available');
    return {
      research: researchItem,
    };
  }

  // Check if the item is marked to be processed
  if (researchItem.should_process !== true) {
    console.log('Research item is not marked for processing');
    return {
      research: researchItem,
    };
  }

  // Check if the item already has a betting pool idea
  if (researchItem.betting_pool_idea) {
    console.log(`Using existing betting pool idea: ${researchItem.betting_pool_idea}`);
    return {
      research: researchItem,
    };
  }

  try {
    console.log(`Generating betting idea for post: ${researchItem.truth_social_post.id}`);

    // Extract key content from the post
    const postContent = researchItem.truth_social_post.content.replace(/<\/?[^>]+(>|$)/g, ''); // Remove HTML tags

    console.log(`Post content: ${postContent.substring(0, 100)}...`);

    // Get timestamps for post creation and current time
    const postCreatedAt = new Date(researchItem.truth_social_post.created_at);
    const currentTime = new Date();

    // Format dates for the prompt
    const postDateFormatted = postCreatedAt.toLocaleString();
    const currentDateFormatted = currentTime.toLocaleString();

    // Calculate the date 7 days from now for grading window
    const sevenDaysFromNow = new Date(currentTime);
    sevenDaysFromNow.setDate(currentTime.getDate() + 7);
    const sevenDaysFormatted = sevenDaysFromNow.toLocaleString();

    // Include any existing research data in the prompt
    const researchItemTyped = researchItem as SingleResearchItem;
    const newsInfo = researchItemTyped.related_news_search_results
      ? `Related news: ${researchItemTyped.related_news_search_results.join(', ')}`
      : 'No related news yet';
    const searchInfo = researchItemTyped.related_tavily_search_results
      ? `Related search results: ${researchItemTyped.related_tavily_search_results.join(', ')}`
      : 'No search results yet';

    // Include any external link content (with less weight)
    let externalLinkInfo = '';
    if (researchItemTyped.external_link_content && researchItemTyped.external_link_url) {
      // Truncate even further for the prompt to avoid overwhelming it
      const truncatedContent =
        researchItemTyped.external_link_content.length > 2000
          ? `${researchItemTyped.external_link_content.substring(0, 2000)}...`
          : researchItemTyped.external_link_content;

      externalLinkInfo = `
<external_link_content>
Source URL: ${researchItemTyped.external_link_url}
Content (treat this as supplementary context with less weight than the Truth Social post):
${truncatedContent}
</external_link_content>`;
    }

    const prompt = `
You are creating a Yes/No betting question based on a Truth Social post by Donald Trump.
The question should be written in Trump's distinctive style, using ALL CAPS for emphasis on certain words and his characteristic tone.
The question must be a clear Yes/No prediction about something that could happen in the FUTURE related to the post.

Truth Social post: "${postContent}"
Post date: ${postDateFormatted}
Current date and time: ${currentDateFormatted}

Research information:
<related_news>
${newsInfo}
</related_news>
<related_web_search_results>
${searchInfo}
</related_web_search_results>
${externalLinkInfo}

IMPORTANT TIMING INSTRUCTIONS:
1. You must ONLY create betting pools for FUTURE events that have not been decided yet
2. Focus on events that will likely be resolved within the next 7 days (by ${sevenDaysFormatted})
3. Avoid creating pools about past events that already happened before ${currentDateFormatted}
4. The resolution criteria must be clear and objectively verifiable

IMPORTANT CONTEXT WEIGHTING:
- Give highest weight to the Truth Social post content
- External link content should be considered supplementary and given less weight
- Use the external link information only to provide context but focus on the Truth Social post for the main idea

Create a Yes/No question in Trump's style that users can bet on. The question should:
1. Be related to the content of the post
2. Be written in FIRST PERSON as if Trump is asking it
3. Use Trump's tendency to use ALL CAPS on specific words to emphasize the question. Avoid using ALL CAPS for the entire question, only use it on specific words.
4. Include Trump's distinctive phrasing and tone
5. Be clear what a YES or NO outcome would mean
6. Focus on something that will be verifiable within the next 7 days
7. Be something that CAN be objectively verified (avoid subjective judgments)

Format your answer as a single Yes/No question with no additional text.
`;

    const response = await config.large_llm.invoke(prompt);

    // Extract the betting pool idea from the response
    const responseContent =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    let bettingPoolIdea = responseContent.trim();

    // Ensure it ends with a question mark
    if (!bettingPoolIdea.endsWith('?')) {
      bettingPoolIdea += '?';
    }

    console.log(`Generated betting pool idea: ${bettingPoolIdea}`);

    // Return updated research item with the betting pool idea
    const updatedResearchItem = {
      ...researchItem,
      betting_pool_idea: bettingPoolIdea,
    };

    return {
      research: updatedResearchItem,
    };
  } catch (error) {
    console.error('Error generating betting pool idea:', error);
    return {
      research: researchItem,
    };
  }
}
