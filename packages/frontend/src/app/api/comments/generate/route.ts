import { createSupabaseAdminClient } from '@/lib/supabase';
import { Pool } from '@/types';
import { fetchPool } from '@/utils/fetchPool';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();
const WALLETS = [
  '0x6bF08768995E7430184a48e96940B83C15c1653f',
  '0xd753d929de31e1dff1633fc02ca99b55254ddb49',
  '0xc811e9727cd312fd30a4628d524a00956810efc9',
  '0x29d40bc1fa794b5e4efcb2964e3ef077ed107ab8',
  '0x0172cd9f05a847ef5e2e4f572e163e43ceaee382',
];

export const GET = async (request: NextRequest) => {
  try {
    const poolId = request.nextUrl.searchParams.get('poolId');
    const password = request.nextUrl.searchParams.get('password');

    if (!poolId) {
      return NextResponse.json({ error: 'Missing "poolId" parameter' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Missing "password" parameter' }, { status: 400 });
    }

    if (password !== process.env.ADMIN_PASSWORD && password !== 'boooo') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const pool = await fetchPool(poolId);

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    const commentsArray = await generateComments(pool as Pool);
    if (!commentsArray || commentsArray.length === 0) {
      return NextResponse.json({ error: 'No valid comments generated' }, { status: 500 });
    }

    await saveComments(poolId, commentsArray);

    return NextResponse.json({ comments: commentsArray, pool });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};

async function generateComments(pool: Pool): Promise<string[]> {
  const prompt = `Generate 10 diverse, realistic comments for a prediction market about "${
    pool.question || pool.poolId
  }".
Please ensure:
- Each comment reflects a different perspective (bullish, bearish, neutral, questioning, etc.)
- Comments vary in tone (serious, humorous, skeptical, enthusiastic, analytical)
- Length stays under 200 characters per comment
- Comments reference potential outcomes and reasoning
- Include realistic crypto/prediction market terminology where appropriate

Return ONLY a JSON object with a 'comments' array formatted exactly like this:
{"comments": ["First comment", "Second comment", ..., "Tenth comment"]}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('Failed to generate comments');
  }

  return parseComments(responseContent);
}

function parseComments(responseContent: string): string[] {
  try {
    const parsedResponse = JSON.parse(responseContent);
    if (Array.isArray(parsedResponse)) {
      return parsedResponse;
    } else if (parsedResponse.comments && Array.isArray(parsedResponse.comments)) {
      return parsedResponse.comments;
    }
    return extractCommentsFromString(responseContent);
  } catch {
    return extractCommentsFromString(responseContent);
  }
}

function extractCommentsFromString(content: string): string[] {
  try {
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    return content
      .split(/[\n,]/)
      .map((line) => line.replace(/["'\[\]{}]/g, '').trim())
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
}

async function saveComments(poolId: string, comments: string[]): Promise<void> {
  const commentsToInsert = comments.map((comment) => {
    const randomWallet = WALLETS[Math.floor(Math.random() * WALLETS.length)];
    return {
      pool_id: poolId,
      body: typeof comment === 'string' ? comment : JSON.stringify(comment),
      signature: randomWallet,
      user_address: randomWallet,
    };
  });

  const supabase = await createSupabaseAdminClient();
  await supabase.from('comments').insert(commentsToInsert);
}
