import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import config, { supabase } from '../../config';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

// Define schema for image prompt output
const imagePromptSchema = z.object({
  imagePrompt: z.string().describe('Generated prompt for Venice AI image generation'),
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
 * Generates an image prompt and image for a single betting pool idea using Anthropic and Venice.ai
 * This enhances the betting pool with a visual element
 */
export async function generateImage(
  state: SingleResearchItemState
): Promise<Partial<SingleResearchItemState>> {
  console.log('Generating image for betting pool idea');

  // Get the research item from state
  const researchItem = state.research;

  // If there's no research item, return early
  if (!researchItem) {
    console.log('No research item available');
    return {
      research: researchItem,
    };
  }

  // Check if the item is marked to be processed and has a betting pool idea
  if (researchItem.should_process !== true || !researchItem.betting_pool_idea) {
    console.log('Research item is not marked for processing or has no betting pool idea');
    return {
      research: researchItem,
    };
  }

  try {
    // Check if the item already has an image URL
    if (
      researchItem.image_url &&
      typeof researchItem.image_url === 'string' &&
      researchItem.image_url.length > 0
    ) {
      console.log(`Using existing image URL: ${researchItem.image_url}`);

      // Return the research item with the existing image URL
      return {
        research: researchItem,
      };
    }

    console.log('Generating image for research item');

    // Extract the betting pool idea and truth social post content
    const bettingPoolIdea = researchItem.betting_pool_idea;
    const truthSocialPost = researchItem.truth_social_post.content.replace(/<\/?[^>]+(>|$)/g, ''); // Remove HTML tags

    // Create a prompt template for image prompt generation
    const imagePromptTemplate = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an expert prompt engineer who will help a user generate a strong prompt to pass to Venice AI to generate an image.

The user has created a bettable idea based on a Truth Social post from Donald Trump and wants to generate an image to go along with it.

Rules:
- The key features of the image should be viewable in a thumbnail
- You should always show Donald Trump in a favorable light in the image
- You should generate a creative and over the top prompt with elements of surrealism, absurdity, and pop culture
- If the bettable idea includes other public figures, you should include them in the image and make sure they're visible in the thumbnail
- If the image has multiple people, you should define how they should be positioned and how they should interact
- Lean towards photo realistic images 
- The image must always include Donald Trump

Your response should only be the prompt and nothing else.`,
      ],
      [
        'human',
        `Here is the Truth Social post from Donald Trump:
{truthSocialPost}

And this is the bettable idea based on it:
{bettingPoolIdea}

Please generate an image prompt for Venice AI.`,
      ],
    ]);

    // Create a structured LLM for image prompt generation
    const structuredLlm = config.large_llm.withStructuredOutput(imagePromptSchema, {
      name: 'generateImagePrompt',
    });

    console.log(`Generating image prompt for: ${bettingPoolIdea.substring(0, 50)}...`);

    // Format the prompt with the Truth Social post and betting pool idea
    const formattedPrompt = await imagePromptTemplate.formatMessages({
      truthSocialPost,
      bettingPoolIdea,
    });

    // Call the structured LLM to generate the image prompt
    const result = await structuredLlm.invoke(formattedPrompt);
    const imagePrompt = result.imagePrompt;

    console.log(`Generated image prompt: ${imagePrompt.substring(0, 100)}...`);

    // Call Venice API to generate the image
    console.log(`Calling Venice API with model: ${config.veniceModel}`);

    // Create request options for Venice API
    const veniceResponse = await fetch('https://api.venice.ai/api/v1/image/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.veniceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.veniceModel,
        prompt: imagePrompt,
        height: 1024,
        width: 1024,
        steps: 20,
        cfg_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000000),
        safe_mode: false,
        return_binary: false,
        hide_watermark: false,
        format: 'webp',
      }),
    });

    if (!veniceResponse.ok) {
      throw new Error(`Venice API error: ${veniceResponse.status} ${veniceResponse.statusText}`);
    }

    // Define the type for Venice API response
    interface VeniceApiResponse {
      result?: {
        image_url: string;
      };
    }

    const veniceData = (await veniceResponse.json()) as VeniceApiResponse;

    // Extract image URL from Venice response
    const veniceImageUrl = veniceData.result?.image_url;

    if (!veniceImageUrl) {
      throw new Error('No image URL returned from Venice API');
    }

    console.log(`Image generated successfully: ${veniceImageUrl}`);

    // Now download the image from Venice and upload to Supabase
    console.log('Downloading image from Venice...');
    const imageResponse = await fetch(veniceImageUrl);

    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`
      );
    }

    // Get the image as blob
    const imageBlob = await imageResponse.blob();

    // Convert blob to array buffer and then to Buffer for Supabase
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a filename based on the prompt
    const filename = generateFilenameFromPrompt(imagePrompt);
    const filepath = `trump-images/${filename}`;

    console.log(`Uploading image to Supabase at path: ${filepath}`);

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from('trump-fun')
      .upload(filepath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image to Supabase: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from('trump-fun').getPublicUrl(filepath);

    const supabaseImageUrl = publicUrlData.publicUrl;

    console.log(`Image uploaded to Supabase: ${supabaseImageUrl}`);

    // Update the research item with the image prompt and URL
    const updatedResearchItem = {
      ...researchItem,
      image_prompt: imagePrompt,
      image_url: supabaseImageUrl, // Store Supabase URL instead of Venice URL
    };

    console.log(`Research item updated with Supabase image URL: ${supabaseImageUrl}`);

    return {
      research: updatedResearchItem,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    // Mark the item as should not process with reason for failure
    // But preserve all other fields
    const updatedResearchItem = {
      ...researchItem,
      should_process: false,
      skip_reason: 'failed_image_generation',
    };

    return {
      research: updatedResearchItem,
    };
  }
}
