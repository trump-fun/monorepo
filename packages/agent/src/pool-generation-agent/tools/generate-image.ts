import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import config, { supabase } from '../../config';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

// Define schema for image prompt output
const imagePromptSchema = z.object({
  imagePrompt: z.string().describe('Generated prompt for Flux AI image generation'),
});

/**
 * Extracts a filename from a prompt
 * Creates a simple filename based on the first few words of the prompt plus timestamp
 */
function generateFilenameFromPrompt(prompt: string): string {
  const timestamp = new Date().getTime();
  // Get the first few words
  const words = prompt.split(' ').slice(0, 4).join('-');
  // Replace special characters
  const cleanWords = words.replace(/[^a-zA-Z0-9-]/g, '');
  return `${cleanWords.substring(0, 50)}-${timestamp}.jpg`;
}

/**
 * Uploads an image buffer to Supabase storage and returns the public URL
 */
async function uploadImageToSupabase(buffer: Buffer, filepath: string): Promise<string> {
  console.log(`Uploading image to Supabase at path: ${filepath}`);

  // Upload to Supabase
  const { error: uploadError } = await supabase.storage.from('trump-fun').upload(filepath, buffer, {
    contentType: 'image/webp',
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload image to Supabase: ${uploadError.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage.from('trump-fun').getPublicUrl(filepath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to get public URL from Supabase');
  }

  return publicUrlData.publicUrl;
}

interface VeniceImageResponse {
  result?: { image_url: string };
  images?: string[];
  request?: {
    format?: string;
  };
  status?: string;
  error?: string;
}

/**
 * Generates an image prompt and image for a single betting pool idea using Anthropic and Flux.ai
 */
export async function generateImageVenice(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Generating image for betting pool idea');

  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    console.log('No research item available');
    return { research: researchItem };
  }

  // Check if the item is marked to be processed and has a betting pool idea
  if (researchItem.should_process !== true || !researchItem.betting_pool_idea) {
    console.log('Research item is not marked for processing or has no betting pool idea');
    return { research: researchItem };
  }

  try {
    if (
      researchItem.image_url &&
      typeof researchItem.image_url === 'string' &&
      researchItem.image_url.length > 0
    ) {
      console.log(`Using existing image URL: ${researchItem.image_url}`);
      return { research: researchItem };
    }

    const bettingPoolIdea = researchItem.betting_pool_idea;
    const truthSocialPost = researchItem.truth_social_post.content.replace(/<\/?[^>]+(>|$)/g, '');

    const imagePromptTemplate = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an expert prompt engineer who will help a user generate a strong prompt to pass to Flux AI to generate an image.

The user has created a bettable idea based on a Truth Social post from Donald Trump and wants to generate an image to go along with it.

Rules:
- The key features of the image should be viewable in a thumbnail
- You should always show Donald Trump in a favorable light in the image
- You should generate a creative and over the top prompt with elements of surrealism, absurdity, and pop culture
- If the bettable idea includes other public figures, you should include them in the image and make sure they're visible in the thumbnail
- If the image has multiple people, you should define how they should be positioned and how they should interact
- Lean towards photo realistic images 
- The image must always include Donald Trump
- VERY IMPORTANT: Your total prompt must be LESS THAN 1500 characters total

Your response should only be the prompt and nothing else.`,
      ],
      [
        'human',
        `Here is the Truth Social post from Donald Trump:
{truthSocialPost}

And this is the bettable idea based on it:
{bettingPoolIdea}

Please generate an image prompt for Flux AI.`,
      ],
    ]);

    const structuredLlm = config.large_llm.withStructuredOutput(imagePromptSchema, {
      name: 'generateImagePrompt',
    });

    const formattedPrompt = await imagePromptTemplate.formatMessages({
      truthSocialPost,
      bettingPoolIdea,
    });

    const result = await structuredLlm.invoke(formattedPrompt);
    const imagePrompt = result.imagePrompt;

    console.log(`Generated image prompt: ${imagePrompt.substring(0, 100)}...`);

    // Call Flux API
    const fluxResponse = await fetch('https://api.us1.bfl.ai/v1/' + config.imageModel, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-key': config.bflApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        width: 1024,
        height: 1024,
      }),
    });

    if (!fluxResponse.ok) {
      throw new Error(`Flux API error: ${fluxResponse.status} ${fluxResponse.statusText}`);
    }

    const fluxData = (await fluxResponse.json()) as { id: string };
    const requestId = fluxData.id;

    // Poll for result
    let fluxImageUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const resultUrl = new URL('https://api.us1.bfl.ai/v1/get_result');
      resultUrl.searchParams.append('id', requestId);

      const resultResponse = await fetch(resultUrl.toString(), {
        headers: {
          accept: 'application/json',
          'x-key': config.bflApiKey,
        },
      });

      if (!resultResponse.ok) {
        attempts++;
        continue;
      }

      const result = (await resultResponse.json()) as {
        status: string;
        result?: { sample: string };
        error?: string;
      };

      if (result.status === 'Ready' && result.result) {
        fluxImageUrl = result.result.sample;
        break;
      } else if (result.status === 'Error') {
        throw new Error(`Error generating image: ${result.error || 'Unknown error'}`);
      }
      attempts++;
    }

    if (!fluxImageUrl) {
      throw new Error('Timed out waiting for image generation');
    }

    // Download and process image
    const imageResponse = await fetch(fluxImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = generateFilenameFromPrompt(imagePrompt);
    const filepath = `trump-images/${filename}`;
    const supabaseImageUrl = await uploadImageToSupabase(buffer, filepath);

    return {
      research: {
        ...researchItem,
        image_prompt: imagePrompt,
        image_url: supabaseImageUrl,
      },
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      research: {
        ...researchItem,
        should_process: false,
        skip_reason: 'failed_image_generation',
      },
    };
  }
}
