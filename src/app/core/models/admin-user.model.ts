export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support';

export interface AdminUser {
  id: string;
  auth_id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  permissions: string[];
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
