'use client';

// Helper to manage local storage for comment likes persistence
export const LIKED_COMMENTS_KEY = 'trump_fun_liked_comments';

// Save a liked comment to local storage
export const saveCommentLike = (commentId: number, liked: boolean) => {
  try {
    // Get current liked comments
    const currentLikedStr = localStorage.getItem(LIKED_COMMENTS_KEY);
    let likedComments: Record<number, boolean> = {};

    if (currentLikedStr) {
      try {
        likedComments = JSON.parse(currentLikedStr);
      } catch (e) {
        console.error('Error parsing liked comments from localStorage:', e);
      }
    }

    // Update the like status
    if (liked) {
      likedComments[commentId] = true;
    } else {
      delete likedComments[commentId];
    }

    // Save back to localStorage
    localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify(likedComments));
    return true;
  } catch (e) {
    console.error('Error saving comment like to localStorage:', e);
    return false;
  }
};

// Check if a comment is liked in local storage
export const isCommentLiked = (commentId: number): boolean => {
  try {
    const currentLikedStr = localStorage.getItem(LIKED_COMMENTS_KEY);
    if (!currentLikedStr) return false;

    const likedComments = JSON.parse(currentLikedStr);
    return Boolean(likedComments[commentId]);
  } catch (e) {
    console.error('Error checking comment like status from localStorage:', e);
    return false;
  }
};

// Get all liked comments
export const getAllLikedComments = (): Record<number, boolean> => {
  try {
    const currentLikedStr = localStorage.getItem(LIKED_COMMENTS_KEY);
    if (!currentLikedStr) return {};

    return JSON.parse(currentLikedStr);
  } catch (e) {
    console.error('Error getting all liked comments from localStorage:', e);
    return {};
  }
};

// Helper to manage local storage for pool FACTS persistence
export const FACTSD_POOLS_KEY = 'trump_fun_factsd_pools';

// Save a FACTS'd pool to local storage
export const savePoolFacts = (poolId: string, factsd: boolean) => {
  try {
    // Get current FACTS'd pools
    const currentFactsdStr = localStorage.getItem(FACTSD_POOLS_KEY);
    let factsdPools: Record<string, boolean> = {};

    if (currentFactsdStr) {
      try {
        factsdPools = JSON.parse(currentFactsdStr);
      } catch (e) {
        console.error("Error parsing FACTS'd pools from localStorage:", e);
      }
    }

    // Update the FACTS status
    if (factsd) {
      factsdPools[poolId] = true;
    } else {
      delete factsdPools[poolId];
    }

    // Save back to localStorage
    localStorage.setItem(FACTSD_POOLS_KEY, JSON.stringify(factsdPools));
    return true;
  } catch (e) {
    console.error('Error saving pool FACTS to localStorage:', e);
    return false;
  }
};

// Check if a pool is FACTS'd in local storage
export const isPoolFactsd = (poolId: string): boolean => {
  try {
    const currentFactsdStr = localStorage.getItem(FACTSD_POOLS_KEY);
    if (!currentFactsdStr) return false;

    const factsdPools = JSON.parse(currentFactsdStr);
    return Boolean(factsdPools[poolId]);
  } catch (e) {
    console.error('Error checking pool FACTS status from localStorage:', e);
    return false;
  }
};

// Get all FACTS'd pools
export const getAllFactsdPools = (): Record<string, boolean> => {
  try {
    const currentFactsdStr = localStorage.getItem(FACTSD_POOLS_KEY);
    if (!currentFactsdStr) return {};

    return JSON.parse(currentFactsdStr);
  } catch (e) {
    console.error("Error getting all FACTS'd pools from localStorage:", e);
    return {};
  }
};
