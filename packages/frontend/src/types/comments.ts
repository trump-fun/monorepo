export interface BaseComment {
  id: string;
  pool_id: string;
  user_address: string;
  body: string;
  created_at: string;
  upvotes: number;
  commentID?: string | null;
}

export interface CommentWithReplies extends BaseComment {
  replies?: BaseComment[];
}

export interface MessageToSign {
  action: 'add_comment' | 'toggle_like';
  poolId: string;
  content: string;
  timestamp: string; // ISO 8601 format
  account: string; // Ethereum address
  commentID?: string;
}

export interface OptimisticComment extends Omit<CommentWithReplies, 'id'> {
  id: string;
  isOptimistic?: boolean;
}
