export interface DeletionFeedbackEntry {
  id: string;
  username: string;
  email: string;
  deleted_at: string;
  deletion_reason: string | null;
  deletion_details: string | null;
}

export interface DeletionFeedbackStats {
  total_deleted: number;
  with_feedback: number;
  last_30_days: number;
  reason_breakdown: Array<{ reason: string; count: number }>;
}

export const DELETION_REASONS: { value: string; label: string }[] = [
  { value: 'not_useful', label: 'Not Useful' },
  { value: 'too_expensive', label: 'Too Expensive' },
  { value: 'privacy_concerns', label: 'Privacy Concerns' },
  { value: 'found_alternative', label: 'Found Alternative' },
  { value: 'too_many_bugs', label: 'Too Many Bugs' },
  { value: 'not_enough_users', label: 'Not Enough Users' },
  { value: 'other', label: 'Other' },
];
