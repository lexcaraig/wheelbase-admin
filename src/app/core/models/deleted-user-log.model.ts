export interface DeletedUserLogEntry {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  deletion_reason: string | null;
  deletion_details: string | null;
  soft_deleted_at: string | null;
  hard_deleted_at: string;
  deleted_by: 'auto' | 'admin';
}

export interface DeletedUsersLogStats {
  total: number;
  auto_count: number;
  admin_count: number;
}

export interface DeletedUsersLogResponse {
  entries: DeletedUserLogEntry[];
  stats: DeletedUsersLogStats;
  total: number;
}
