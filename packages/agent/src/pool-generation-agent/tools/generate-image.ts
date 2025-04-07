import config, { supabase } from '../../config';
import type { SingleResearchItemState } from '../single-betting-pool-graph';

// Import or define LARGE_LLM_PROVIDER
const LARGE_LLM_PROVIDER = process.env.LARGE_LLM_PROVIDER || 'anthropic';

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

interface VeniceTextResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface VeniceImageResponse {
  result?: { image_url: string };
  images?: string[];
}

/**
 * Generates an image prompt and image for a single betting pool idea using Venice AI
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
    return { research: researchItem };
  }

  // Check if the item is marked to be processed and has a betting pool idea
  if (researchItem.should_process !== true || !researchItem.betting_pool_idea) {
    console.log('Research item is not marked for processing or has no betting pool idea');
    return { research: researchItem };
  }

  try {
    // Check if the item already has an image URL
    if (
      researchItem.image_url &&
      typeof researchItem.image_url === 'string' &&
      researchItem.image_url.length > 0
    ) {
      console.log(`Using existing image URL: ${researchItem.image_url}`);
      return { research: researchItem };
    }

    console.log('Generating image for research item');

    // Extract the betting pool idea and truth social post content
    const bettingPoolIdea = researchItem.betting_pool_idea;
    const truthSocialPost = researchItem.truth_social_post.content.replace(/<\/?[^>]+(>|$)/g, ''); // Remove HTML tags

    // Create system instructions for Venice AI
    const systemInstructions = `You are an expert prompt engineer who will help a user generate a strong prompt to pass to Venice AI to generate an image.

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

Your response should only be the prompt and nothing else.`;

    // Create user prompt for Venice AI
    const userPrompt = `Here is the Truth Social post from Donald Trump:
${truthSocialPost}

And this is the bettable idea based on it:
${bettingPoolIdea}

Please generate an image prompt for Venice AI.`;

    console.log(`Generating image prompt for: ${bettingPoolIdea.substring(0, 50)}...`);

    // Call Venice AI for text generation
    const veniceTextResponse = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.veniceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:
          LARGE_LLM_PROVIDER === 'venice'
            ? process.env.VENICE_LARGE_LLM || 'mistral-31-24b'
            : 'mistral-31-24b',
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userPrompt },
        ],
        venice_parameters: {
          enable_web_search: 'auto',
          include_venice_system_prompt: true,
        },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!veniceTextResponse.ok) {
      throw new Error(
        `Venice AI text generation error: ${veniceTextResponse.status} ${veniceTextResponse.statusText}`
      );
    }

    const veniceTextData = (await veniceTextResponse.json()) as VeniceTextResponse;

    if (!veniceTextData.choices?.[0]?.message?.content) {
      throw new Error('Venice AI did not return expected response format');
    }

    const imagePrompt = veniceTextData.choices[0].message.content;

    // Ensure the prompt isn't too long for Venice AI image generation
    const maxPromptLength = 1450; // Leaving some buffer
    const truncatedPrompt =
      imagePrompt.length > maxPromptLength
        ? imagePrompt.substring(0, maxPromptLength) + '...'
        : imagePrompt;

    if (imagePrompt.length > maxPromptLength) {
      console.log(
        `Truncated image prompt from ${imagePrompt.length} to ${maxPromptLength} characters`
      );
    }

    console.log(`Generated image prompt: ${truncatedPrompt.substring(0, 100)}...`);

    // Call Venice API to generate the image
    const veniceResponse = await fetch('https://api.venice.ai/api/v1/image/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.veniceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.imageModel,
        prompt: truncatedPrompt,
        height: 1024,
        width: 1024,
        steps: 20,
        cfg_scale: 7.5,
        seed: Math.floor(Math.random() * 999999999),
        safe_mode: false,
        return_binary: false,
        hide_watermark: false,
        format: 'webp',
      }),
    });

    if (!veniceResponse.ok) {
      throw new Error(`Venice API error: ${veniceResponse.status} ${veniceResponse.statusText}`);
    }

    const veniceData = (await veniceResponse.json()) as VeniceImageResponse;

    // Generate a filename for the image
    const filename = generateFilenameFromPrompt(truncatedPrompt);
    const filepath = `trump-images/${filename}`;
    let supabaseImageUrl: string;

    if (veniceData.result?.image_url) {
      // Handle direct URL response
      const veniceImageUrl = veniceData.result.image_url;
      console.log(`Image generated successfully: ${veniceImageUrl}`);

      // Download the image from Venice
      const imageResponse = await fetch(veniceImageUrl);
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`
        );
      }

      // Convert to buffer for upload
      const imageBlob = await imageResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase
      supabaseImageUrl = await uploadImageToSupabase(buffer, filepath);
    } else if (veniceData.images?.[0]) {
      // Handle base64 image response
      console.log('Processing base64 image data from Venice');
      const buffer = Buffer.from(veniceData.images[0], 'base64');

      // Upload to Supabase
      supabaseImageUrl = await uploadImageToSupabase(buffer, filepath);
    } else {
      throw new Error('No image data returned from Venice API');
    }

    console.log(`Image uploaded to Supabase: ${supabaseImageUrl}`);
    const updatedResearch = {
      ...researchItem,
      image_prompt: truncatedPrompt,
      image_url: supabaseImageUrl,
    };

    // Update the research item with the image prompt and URL
    return {
      research: updatedResearch,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    // Preserve all fields but mark as should not process with reason for failure
    return {
      research: {
        ...researchItem,
        should_process: false,
        skip_reason: 'failed_image_generation',
      },
    };
  }
}
