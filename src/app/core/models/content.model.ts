export type ContentType = 'post' | 'comment';
export type ModerationAction = 'approve' | 'remove';

export interface FlaggedContent {
  id: string;
  content_id: string;
  content_type: ContentType;
  content: string;
  author_id: string;
  author_username: string;
  author_avatar_url: string | null;
  flag_reason: string;
  flagged_at: string;
  is_reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  action_taken: ModerationAction | null;
}

export interface FlaggedContentResponse {
  content: FlaggedContent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ModerationRequest {
  content_id: string;
  content_type: ContentType;
  action: ModerationAction;
  reason?: string;
}
