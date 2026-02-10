export interface AppUser {
  id: string;
  auth_id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  country_code: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  banned_by: string | null;
  account_status: 'active' | 'deleted' | 'suspended';
  deleted_at: string | null;
  deletion_reason: string | null;
  deletion_details: string | null;
  subscription_tier: 'free' | 'pro' | 'premium';
  created_at: string;
  last_active_at: string | null;
}

export interface UserStats {
  total_rides: number;
  total_posts: number;
  total_comments: number;
  total_followers: number;
  total_following: number;
  groups_count: number;
}

export interface UserDetail extends AppUser {
  stats: UserStats;
  motorcycles: Motorcycle[];
  recent_posts: RecentPost[];
  recent_rides: RecentRide[];
}

export interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  is_primary: boolean;
}

export interface RecentPost {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export interface RecentRide {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  distance_km: number;
  participants_count: number;
}

export interface UsersListResponse {
  users: AppUser[];
  total: number;
  page: number;
  pageSize: number;
}
