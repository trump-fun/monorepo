// Keep pending updates in memory
let pendingLikes: Record<string, boolean> = {};
let saveTimeout: NodeJS.Timeout | null = null;

// Get current likes from storage
function getLikedComments(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('likedComments') || '{}');
  } catch {
    return {};
  }
}

// Save pending updates to storage
function savePendingLikes() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  const currentLikes = getLikedComments();
  const updatedLikes = { ...currentLikes, ...pendingLikes };
  localStorage.setItem('likedComments', JSON.stringify(updatedLikes));
  pendingLikes = {};
}

export function isCommentLiked(commentId: string): boolean {
  // Check pending likes first
  if (commentId in pendingLikes) {
    return pendingLikes[commentId];
  }
  return !!getLikedComments()[commentId];
}

export function saveCommentLike(commentId: string, isLiked: boolean): void {
  // Store in pending updates
  pendingLikes[commentId] = isLiked;

  // Debounce save to storage
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(savePendingLikes, 1000);
}
