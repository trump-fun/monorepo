import axios from 'axios';
import config from '../../config';

/**
 * Gets basic user information from X/Twitter
 *
 * @param username X/Twitter username
 * @returns User profile information
 */
export async function getUserInfo(username: string): Promise<any> {
  try {
    console.log(`Getting user info for @${username}`);

    // Use Datura API to get user info
    const userResponse = await axios.get('https://apis.datura.ai/twitter/user', {
      params: { user: username },
      headers: {
        Authorization: `Bearer ${config.daturaApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.data) {
      throw new Error(`No user data returned for @${username}`);
    }

    return {
      id: userResponse.data.id,
      name: userResponse.data.name || username,
      username: userResponse.data.username || username,
      bio: userResponse.data.description || '',
      followers_count: userResponse.data.followers_count || 0,
      following_count: userResponse.data.following_count || 0,
      tweet_count: userResponse.data.statuses_count || 0,
      created_at: userResponse.data.created_at,
      profile_image_url: userResponse.data.profile_image_url,
      verified: userResponse.data.verified || false,
    };
  } catch (error) {
    console.error(`Error getting user info for @${username}:`, error);

    // Return basic fallback info if API call fails
    return {
      name: username,
      username: username,
      bio: '',
      followers_count: 0,
      following_count: 0,
      tweet_count: 0,
    };
  }
}

/**
 * Gets recent posts from a user
 *
 * @param username X/Twitter username
 * @param count Number of posts to retrieve
 * @returns Array of user posts
 */
export async function getUserPosts(username: string, count: number = 100): Promise<any[]> {
  try {
    console.log(`Getting recent posts for @${username} (max: ${count})`);

    // Use Datura API to get user timeline
    const timelineResponse = await axios.get('https://apis.datura.ai/twitter/user_timeline', {
      params: { user: username, count },
      headers: {
        Authorization: `Bearer ${config.daturaApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!timelineResponse.data || !Array.isArray(timelineResponse.data)) {
      console.warn(`Invalid timeline data for @${username}`);
      return [];
    }

    console.log(`Retrieved ${timelineResponse.data.length} posts from @${username}`);
    return timelineResponse.data;
  } catch (error) {
    console.error(`Error getting posts for @${username}:`, error);
    return [];
  }
}
