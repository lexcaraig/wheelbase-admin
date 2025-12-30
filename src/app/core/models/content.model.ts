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

// Service Provider Review Reports
export type ReviewReportReason = 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other';
export type ReviewReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';
export type ReviewModerationAction = 'dismiss' | 'hide_review' | 'ban_user';

export interface ReviewReport {
  id: string;
  review_id: string;
  review_text: string;
  review_rating: number;
  review_created_at: string;
  reviewer_id: string;
  reviewer_username: string;
  reviewer_avatar_url: string | null;
  provider_id: string;
  provider_name: string;
  reporter_id: string;
  reporter_username: string;
  reason: ReviewReportReason;
  description: string | null;
  status: ReviewReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  action_taken: ReviewModerationAction | null;
  admin_notes: string | null;
}

export interface ReviewReportsResponse {
  reports: ReviewReport[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewModerationRequest {
  report_id: string;
  action: ReviewModerationAction;
  admin_notes?: string;
}
